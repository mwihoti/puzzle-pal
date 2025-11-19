const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "demo-no-project",
});

const db = admin.firestore();
db.settings({ host: "localhost:8081", ssl: false });

async function populateQuestions() {
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
  console.log("Questions uploaded successfully!");
  process.exit(0);
}

populateQuestions().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});