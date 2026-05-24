// models/users.js
const { required } = require("joi");
const mongoose = require("mongoose");
//User Schema
const UserSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true, minlength: 2, maxlength: 99 },
    middle: { type: String, default: "" },
    last: { type: String, required: true, minlength: 2, maxlength: 99 },
  },
  isBusiness: { type: Boolean, default: false },
  phone: { type: String, required: true, minlength: 9, maxlength: 20 },
  email: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 199,
    unique: true,
  },
  password: { type: String, required: true, minlength: 6, maxlength: 1024 },
  address: {
    state: { type: String, default: "" },
    country: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    houseNumber: { type: String, required: true },
  },
  image: {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
});

//User Model
const UserModal = mongoose.model("users", UserSchema);
//Export the User Model
module.exports = UserModal;
