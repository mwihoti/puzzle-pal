const admin = require("firebase-admin");
const path = require("path");

// Use service account file if exists, otherwise use default credentials
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
let initOptions = { projectId: "puzzle-pal-3a21b" };

try {
  const fs = require("fs");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    initOptions = {
      credential: admin.credential.cert(serviceAccount),
      projectId: "puzzle-pal-3a21b"
    };
    console.log("Using service account key for authentication");
  }
} catch (e) {
  console.log("No service account key found, using application default credentials");
}

admin.initializeApp(initOptions);
const db = admin.firestore();

async function populateQuestions() {
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

    console.log("Connecting to Firestore project: puzzle-pal-3a21b");
    console.log("Writing questions to collection: puzzles/set1");
    
    await db.collection("puzzles").doc("set1").set(questionsData);
    console.log("✅ Questions uploaded successfully!");
    console.log("Total questions: " + questionsData.questions.length);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
}

populateQuestions();