const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();

const userRoutes = require("./routes/user");
const betRoutes = require("./routes/bet");
const Bet = require("./models/bet");
const User = require("./models/user");
const Round = require("./models/round");

const app = express();
app.use(cors());
app.use(express.json());

let countdown = 60; // 1 minute countdown
let timerInterval;
let roundId = 1;

// HTTP server + socket.io bind
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        console.log("MongoDB connected successfully");
        app.use("/user", userRoutes);
        app.use("/bet", betRoutes);

        // check last round
        let lastRound = await Round.findOne().sort({ roundId: -1 });
        if (!lastRound) {
            const newRound = new Round({ roundId: 1 });
            await newRound.save();
            roundId = 1;
        } else {
            roundId = lastRound.roundId;
        }
        console.log("Starting from round:", roundId);
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// Simple route
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Socket.io logic
io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    // Send current timer to new user
    socket.emit("timerUpdate", countdown);

    // Start timer if not running
    if (!timerInterval) {
        timerInterval = setInterval(async () => {
            if (countdown > 0) {
                countdown--;
                io.emit("timerUpdate", countdown);
            } else {
                io.emit("timerFinished", { roundId });
                countdown = 60;
                roundId++;

                // New round document
                const newRound = new Round({
                    roundId,
                    result: "pending"
                });
                await newRound.save();

                console.log("New round:", roundId);
            }
        }, 1000);
    }

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });

    // Bet placement
    socket.on("placeBet", async (data) => {
        try {
            const user = await User.findOne({ username: "hemraj" }); // Hardcoded for now

            if (!user) {
                return socket.emit("betError", { message: "User not found" });
            }

            if (user.balance < data.amount) {
                return socket.emit("betError", { message: "Insufficient balance" });
            }

            // Save bet
            const newBet = new Bet({
                user: user.username,
                betid: Date.now(),
                roundid: roundId,
                betamount: data.amount,
                betnumber: data.betnumber,
                result: "pending"
            });
            await newBet.save();

            // Deduct balance
            user.balance -= data.amount;
            await user.save();

            // Success alert
            socket.emit("betSuccess", {
                message: `Bet placed successfully! ${data.amount} ₹ deducted from your balance`,
                balance: user.balance,
                roundid: roundId,
                betnumber: data.betnumber
            });

            console.log(`Bet placed: ${data.amount} ₹ deducted, Round: ${roundId}`);

            // Declare result after 50 seconds
            setTimeout(async () => {
                const result = Math.random() > 0.5 ? "winner" : "lose";

                newBet.result = result;
                await newBet.save();

                if (result === "winner") {
                    user.balance += data.amount * 2;
                    await user.save();
                }

                socket.emit("betResult", {
                    betid: newBet.betid,
                    roundid: newBet.roundid,
                    betnumber: newBet.betnumber,
                    result,
                    balance: user.balance,
                });

                console.log(`Result: ${result}, User balance: ${user.balance}`);
            }, 30 * 1000); // 50 sec

        } catch (err) {
            console.error("Error placing bet:", err);
            socket.emit("betError", { message: "Server error while placing bet" });
        }
    });
});

// Start server
const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
