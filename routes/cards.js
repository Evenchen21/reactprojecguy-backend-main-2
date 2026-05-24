const express = require("express");
const router = express.Router();
const joi = require("joi");
const Card = require("../models/cards");
const User = require("../models/users");
const auth = require("../middlewares/auth");

// ----------------------------------------- //

const cardsSchema = joi.object({
  title: joi.string().min(2).max(255).required(),
  subtitle: joi.string().min(2).max(255).required(),
  description: joi.string().min(2).max(1024).required(),
  phone: joi.string().min(9).max(15).required(),
  email: joi.string().email().min(2).max(199).required(),
  web: joi.string().allow(""),
  imageUrl: joi.string().required(),
  imageAlt: joi.string().allow(""),
});

// Schema for admin updating bizNumber
const bizNumberSchema = joi.object({
  bizNumber: joi.number().integer().min(0).required(),
});

const validateCard = (card) => {
  return cardsSchema.validate(card);
};

// ----------------------------------------- //

// Get all the Cards
router.get("/", async (req, res) => {
  try {
    const cards = await Card.find();
    res.status(200).send(cards);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get user's own cards || ONLY for authenticated users
router.get("/my-cards", auth, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user._id });
    res.status(200).send(cards);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Get single card by ID
router.get("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");
    res.status(200).send(card);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Create a new Card || ONLY for Business users
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is a business user
    if (!req.user.isBusiness) {
      return res
        .status(403)
        .send("Access denied. Only business users can create cards.");
    }

    const { error } = cardsSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const card = new Card({
      ...req.body,
      userId: req.user._id,
    });
    await card.save();
    res.status(201).send(card);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Update the Card by ID || ONLY for the card creator
router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = cardsSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");

    // Check if user is the card creator
    if (card.userId.toString() !== req.user._id) {
      return res
        .status(403)
        .send("Access denied. You can only edit your own cards.");
    }

    const updatedCard = await Card.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true },
    );
    res.status(200).send(updatedCard);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Update bizNumber (Admin only)
router.patch("/:id/bizNumber", auth, async (req, res) => {
  try {
    if (!req.user.isBusiness) {
      return res.status(403).send("Access denied. Admin only.");
    }

    const { error } = bizNumberSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");

    card.bizNumber = req.body.bizNumber;
    await card.save();
    res.status(200).send(card);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Like/Unlike card || ONLY for authenticated users
router.patch("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");

    // Check if user already liked the card
    const likeIndex = card.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      // Unlike the card
      card.likes.splice(likeIndex, 1);
    } else {
      // Like the card
      card.likes.push(req.user._id);
    }

    await card.save();
    res.status(200).send(card);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Delete the Card by ID || ONLY for the card creator or admin
router.delete("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).send("Card not found");

    // Check if user is the card creator or an admin
    if (card.userId.toString() !== req.user._id && !req.user.isBusiness) {
      return res
        .status(403)
        .send("Access denied. You can only delete your own cards.");
    }

    await Card.findByIdAndDelete(req.params.id);
    res.status(200).send("Card deleted successfully");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
// ----------------------------------------- //
