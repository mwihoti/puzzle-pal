const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true }); 
admin.initializeApp();
const db = admin.firestore();

exports.createGroup = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { data } = req.body;
      const { groupName, leaderName, members = [] } = data || {};

      if (!groupName?.trim() || !leaderName?.trim()) {
        return res.status(400).json({ error: "Missing groupName or leaderName" });
      }

      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "members must be an array" });
      }

      const groupRef = await db.collection("groups").add({
        groupName: groupName.trim(),
        leaderName: leaderName.trim(),
        members,
        submitted: false,
        score: null,
        timestamp: null
      });

      console.log("Group created:", groupRef.id);
      return res.status(200).json({ groupId: groupRef.id });
    } catch (err) {
      console.error('Error in createGroup:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

exports.submitAnswers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { data } = req.body;
      const { groupId, answers } = data || {};

      if (!groupId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: "Invalid data" });
      }

      const groupRef = db.collection("groups").doc(groupId);
      const groupSnap = await groupRef.get();
      if (!groupSnap.exists) return res.status(404).json({ error: "Group not found" });
      if (groupSnap.data()?.submitted) return res.status(409).json({ error: "Already submitted" });

      const puzzleSnap = await db.collection("puzzles").doc("set1").get();
      const correctQuestions = puzzleSnap.data()?.questions || [];

      let score = 0;
      answers.forEach(user => {
        const correct = correctQuestions.find(q => String(q.id) === String(user.id));
        if (correct && user.answer.trim().toUpperCase() === correct.answer.trim().toUpperCase()) {
          score++;
        }
      });

      await groupRef.update({
        submitted: true,
        score,
        timestamp: new Date(),
      });

      await db.collection("leaderboard").doc(groupId).set({
        groupName: groupSnap.data().groupName,
        leaderName: groupSnap.data().leaderName,
        score,
        timestamp: Date.now(),
      });

      return res.status(200).json({ score });
    } catch (err) {
      console.error('Error in submitAnswers:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

exports.getQuestions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const puzzleSnap = await db.collection("puzzles").doc("set1").get();
      if (!puzzleSnap.exists) {
        return res.status(404).json({ error: "Questions not found" });
      }
      const questions = puzzleSnap.data()?.questions || [];
      return res.status(200).json({ questions });
    } catch (err) {
      console.error('Error in getQuestions:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

exports.getLeaderboard = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const leaderboardSnap = await db.collection("leaderboard").orderBy("score", "desc").get();
      const leaderboard = [];
      leaderboardSnap.forEach(doc => {
        leaderboard.push({
          groupId: doc.id,
          ...doc.data()
        });
      });
      return res.status(200).json({ leaderboard });
    } catch (err) {
      console.error('Error in getLeaderboard:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

exports.seedQuestions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const questionsData = {
  "questions": [
    { "id": 1, "q": "Cardano consensus protocol?", "answer": "OUROBOROS" },
    { "id": 2, "q": "Smallest ADA unit?", "answer": "LOVELACE" },
    { "id": 3, "q": "Intersect is tasked with maintaining Cardano ________ ?", "answer": "core technology" },
    { "id": 4, "q": "Intersect is tasks with shaping Cardano future ________.", "answer": "roadmap" },
    { "id": 5, "q": "Intersect is a ____-based organization.", "answer": "MEMBER" },
    { "id": 6, "q": "As a natural gathering place, Intersect is kind of a ______________ for Cardano?", "answer": "town square" },
    {"id": 7, "q": "Intersect has how many committees?", "answer": "8"},
    { "id": 8, "q": "Intersect role is not to dictate, but to empower and _____", "answer": "inform"},
    { "id": 9, "q": "Intersect is registered as a as a Mutual Benefit Nonprofit organization in this US state: _______", "answer": "Wyoming" },
    { "id": 10, "q": "This Intersect committee is in charge of Cardano’s Vision, strategy, and roadmap?", "answer": "Product" },
    {"id": 11, "q": "This committee is in charge of Intersect membership sales, account management, community support, tooling grants, education, and engaging events?", "answer": "MCC" },
     {"id": 12, "q": "This Intersect committee provides facilitation and oversight to the Cardano Community related to the governance of Cardano?", "answer": "Civics"},
 {"id": 13,  "q": "On January 29, 2025, Cardano achieved the transition to full community governance with the enactment of this hard fork upgrade: ______", "answer": "Plomin" }


  ]
}



      await db.collection("puzzles").doc("set1").set(questionsData);
      console.log("Questions seeded successfully");
      return res.status(200).json({ message: "Questions seeded successfully", count: questionsData.questions.length });
    } catch (err) {
      console.error('Error in seedQuestions:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});