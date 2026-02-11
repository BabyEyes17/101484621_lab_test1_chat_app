const mongoose = require("mongoose");

const userShema = new mongoose.Schema({

    username: {type: String, required: true, unique: true, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password: {type: String, required: true},
    createdOn: {type: Date, default: Date.now}
})

module.exports = mongoose.model("User", userShema)
