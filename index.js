const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.createGroup = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
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

exports.submitAnswers = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
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