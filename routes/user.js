const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const user = require("../models/user");

// GET endpoint: Get all users

router.get("/", async (req, resp) => {
    try {
        const messages = await user.find().sort({ createdAt: 1 }); // Correct variable name
        resp.json(messages); // Use the correct variable here
    } catch (err) {
        resp.status(500).json({ error: "server error" });
    }
});

// POST endpoint: Create a new user
router.post("/", async (req, resp) => {
    console.log(req.body)
    try {
        const newuser = new user(req.body);
        const saveduser = await newuser.save();
        resp.status(200).json(saveduser);
    } catch (err) {
        resp.status(500).json({ error: "Failed to create user", details: err.message });
    }
});

module.exports = router;
