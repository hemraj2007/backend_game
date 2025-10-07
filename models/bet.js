const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  user: { type: String, required: true },
  betid: { type: Number, required: true },
  roundid: { type: Number, required: true, default: 1 },
  betamount: { type: Number, required: true },
  betnumber: { type: Number, required: true },
  result: { type: String, default: "pending" },   // winner / lose / pending
},
  {
    timestamps: true   
  }
);

module.exports = mongoose.model("bet", betSchema);
