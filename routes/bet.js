const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bet = require("../models/bet")

router.get("/", async (req, resp) => {
    try {
        const message = await bet.find().sort({ createdAt: 1 });
        resp.json(message);
    } catch (err) {
        resp.status(500).json({ error: "server error" })
    }
})

// POST endpoint: Create a new bet
router.post("/", async (req, resp) => {
    console.log(req.body)
    try {
        const newBet = new bet(req.body);
        const savedBet = await newBet.save();
        resp.status(201).json(savedBet);
    } catch (err) {
        resp.status(500).json({ error: "Failed to create bet", details: err.message });
    }
});

module.exports = router;