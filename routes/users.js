// routes/users.js
const express = require("express");
const User = require("../models/users");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const joi = require("joi");
const auth = require("../middlewares/auth");
// ----------------------------------------- //

// Validation Schemas
const registerSchema = joi.object({
  firstName: joi.string().min(2).max(99).required(),
  middleName: joi.string().max(99).allow(""),
  lastName: joi.string().min(2).max(99).required(),
  isBusiness: joi.boolean().default(false),
  phone: joi.string().min(9).max(20).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).max(1024).required(),
  state: joi.string().allow(""),
  country: joi.string().required(),
  city: joi.string().required(),
  street: joi.string().required(),
  houseNumber: joi.string().required(),
  imageUrl: joi.string().allow(""),
  imageAlt: joi.string().allow(""),
});

const loginSchema = joi.object({
  email: joi.string().email().required("Email is required"),
  password: joi.string().min(6).max(1024).required("Password is required"),
});

const editUserSchema = joi
  .object({
    firstName: joi.string().min(2).max(99),
    middleName: joi.string().max(99).allow(""),
    lastName: joi.string().min(2).max(99),
    phone: joi.string().min(9).max(20),
    state: joi.string().allow(""),
    country: joi.string(),
    city: joi.string(),
    street: joi.string(),
    houseNumber: joi.string(),
    imageUrl: joi.string().allow(""),
    imageAlt: joi.string().allow(""),
  })
  .min(1);
// ----------------------------------------- //

// Register new User

router.post("/", async (req, res) => {
  try {
    // Validate the request body
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if user already exists in the DataBase
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send("User Already Registered!");

    // Hash/Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new User
    user = new User({
      name: {
        first: req.body.firstName,
        middle: req.body.middleName || "",
        last: req.body.lastName,
      },
      isBusiness: req.body.isBusiness || false,
      phone: req.body.phone,
      email: req.body.email,
      password: hashedPassword,
      address: {
        state: req.body.state || "",
        country: req.body.country,
        city: req.body.city,
        street: req.body.street,
        houseNumber: req.body.houseNumber,
      },
      image: {
        url: req.body.imageUrl || "",
        alt: req.body.imageAlt || "",
      },
    });

    // Save the user to the database
    await user.save();

    const token = jwt.sign(
      { _id: user._id, isBusiness: user.isBusiness },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );
    res
      .status(201)
      .send({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Checks if user exists in the DataBase
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password.");

    // Validate the Password
    const validateThePassword = await bcrypt.compare(
      req.body.password,
      user.password,
    );
    if (!validateThePassword)
      return res.status(400).send("Invalid email or password.");
    // Generate a JWT Token
    const token = jwt.sign(
      {
        _id: user._id,
        isBusiness: user.isBusiness,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );
    res.send({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get all users (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user.isBusiness) {
      return res.status(403).send("Access denied. Admin only.");
    }
    const users = await User.find().select("-password");
    res.send(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Get user by ID (The registered user or admin)
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).send("User not found");

    // Check if the user is the owner or an admin
    if (req.user._id !== req.params.id && !req.user.isBusiness) {
      return res.status(403).send("Access denied.");
    }

    res.send(user);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Edit user (if registered user)
router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = editUserSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if the user is the owner
    if (req.user._id !== req.params.id) {
      return res
        .status(403)
        .send("Access denied. You can only edit your own profile.");
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    // Update user fields
    if (req.body.firstName) user.name.first = req.body.firstName;
    if (req.body.middleName !== undefined)
      user.name.middle = req.body.middleName;
    if (req.body.lastName) user.name.last = req.body.lastName;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.state !== undefined) user.address.state = req.body.state;
    if (req.body.country) user.address.country = req.body.country;
    if (req.body.city) user.address.city = req.body.city;
    if (req.body.street) user.address.street = req.body.street;
    if (req.body.houseNumber) user.address.houseNumber = req.body.houseNumber;
    if (req.body.imageUrl !== undefined) user.image.url = req.body.imageUrl;
    if (req.body.imageAlt !== undefined) user.image.alt = req.body.imageAlt;

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Change isBusiness status (The registered user)
router.patch("/:id", auth, async (req, res) => {
  try {
    // Check if the user is the owner
    if (req.user._id !== req.params.id) {
      return res
        .status(403)
        .send("Access denied. You can only change your own status.");
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    // Toggle or set isBusiness status
    if (req.body.isBusiness !== undefined) {
      user.isBusiness = req.body.isBusiness;
    }

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Delete user (The registered user or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if the user is the owner or an admin
    if (req.user._id !== req.params.id && !req.user.isBusiness) {
      return res.status(403).send("Access denied.");
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send("User not found");

    res.send("User deleted successfully");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
