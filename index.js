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
        questions: [
          { id: "1", q: "Cardano consensus protocol?", answer: "OUROBOROS" },
          { id: "2", q: "Smallest ADA unit?", answer: "LOVELACE" },
          { id: "3", q: "Cardano governance program?", answer: "CATALYST" },
          { id: "4", q: "Hydra is a ______ solution.", answer: "SCALING" },
          { id: "5", q: "Intersect is a ____-based organization.", answer: "MEMBER" },
          { id: "6", q: "What is the native cryptocurrency of the Cardano blockchain?", answer: "ADA" },
          { id: "7", q: "Which university collaborated with IOHK to develop Cardano?", answer: "EDINBURGH" },
          { id: "8", q: "What is the name of Cardano's proof-of-stake consensus algorithm?", answer: "OUROBOROS" },
          { id: "9", q: "Which founder created Cardano and was the co-founder of Ethereum?", answer: "CHARLES" },
          { id: "10", q: "What does UTXO stand for in blockchain technology?", answer: "UNSPENT TRANSACTION OUTPUT" },
          { id: "11", q: "How many phases does Cardano's development roadmap include?", answer: "5" },
          { id: "12", q: "What is the smart contract language used on Cardano?", answer: "PLUTUS" },
          { id: "13", q: "What is the name of Cardano's scaling solution?", answer: "HYDRA" }
        ]
      };

      await db.collection("puzzles").doc("set1").set(questionsData);
      console.log("Questions seeded successfully");
      return res.status(200).json({ message: "Questions seeded successfully", count: questionsData.questions.length });
    } catch (err) {
      console.error('Error in seedQuestions:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});