const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username :{type: String, required: true},
    balance :{type: Number, required: true}
},
{
    timestamps: true
}

);

module.exports = mongoose.model("user", userSchema);