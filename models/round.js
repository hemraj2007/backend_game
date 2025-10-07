const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  roundId: { type: Number, required: true, default: 1 },
}, 
{
    timestamps: true   
}
);

module.exports = mongoose.model("Round", roundSchema);
