const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const callNvidiaAPI = require('../utils/callNvidiaAPI');

router.post('/chatbot', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    let aiResponse = await callNvidiaAPI(message);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("🔴 Chatbot Error:", error);
    res.status(500).json({ error: "Failed to generate chatbot response." });
  }
});

module.exports = router; 