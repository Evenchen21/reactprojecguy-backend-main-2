require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const Card = require("../models/cards");

/**
 * This function creates a user if they don't already exist.
 * It checks by email to avoid creating duplicate users.
 */
async function createUserIfNotExists(userData) {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    console.log(`User ${userData.email} already exists. Skipping.`);
    return existingUser;
  }

  // Hash the password before saving it to the database
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const user = new User({
    name: {
      first: userData.firstName,
      middle: userData.middleName || "",
      last: userData.lastName,
    },
    isBusiness: userData.isBusiness || false,
    phone: userData.phone,
    email: userData.email,
    password: hashedPassword, // Storing the hashed password //
    address: {
      state: userData.state || "",
      country: userData.country || "test",
      city: userData.city || "test",
      street: userData.street || "test",
      houseNumber: userData.houseNumber || "1",
    },
    image: {
      url: userData.imageUrl || "",
      alt: userData.imageAlt || "",
    },
  });

  await user.save();
  return user;
}

/**
 * This function creates a card if it doesn't already exist for a user.
 * It checks by title and userId to avoid duplicates.
 */
async function createCardIfNotExists(cardData, userId) {
  const existingCard = await Card.findOne({
    title: cardData.title,
    userId: userId,
  });
  if (existingCard) {
    return existingCard;
  }

  const card = new Card({
    ...cardData,
    image: {
      url: cardData.image.url || "https://via.placeholder.com/300", // Default placeholder image //
      alt: cardData.image.alt || "placeholder image",
    },
    userId: userId, // Link the card to the user who created it
    createdAt: new Date(),
  });

  await card.save();
  console.log(`Created card: "${card.title}"`);
  return card;
}

/**
 * Main function to run the seed script.
 */
async function run() {
  try {
    const uri = process.env.DB_HOST;
    if (!uri) {
      throw new Error("DB_HOST not set in environment. Check your .env file.");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Here's the data for the users we want to create
    const usersToCreate = [
      {
        firstName: "Regular",
        lastName: "User",
        email: "regular@example.test",
        password: "password123", // Note: Hardcoded password for dev only!
        isBusiness: false,
        phone: "050-1111111",
      },
      {
        firstName: "Business",
        lastName: "User",
        email: "business@example.test",
        password: "password123",
        isBusiness: true,
        phone: "050-2222222",
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.test",
        password: "password123",
        isBusiness: true,
        phone: "050-3333333",
      },
    ];

    // Loop over the user data and create each one
    const createdUsers = [];
    for (const userData of usersToCreate) {
      const user = await createUserIfNotExists(userData);
      createdUsers.push(user);
    }

    // Data for the cards we want to create, one for each user
    const cardsToCreate = [
      {
        title: "Regular Visitor Card",
        subtitle: "Visitor",
        description: "A visitor card for a regular user",
        phone: "050-1111111",
        email: "regular-card@example.test",
        web: "",
        image: { url: "", alt: "" },
        address: {
          state: "",
          country: "test",
          city: "test",
          street: "N/A",
          houseNumber: "0",
        },
        bizNumber: 0,
      },
      {
        title: "Business Card",
        subtitle: "Business",
        description: "A business card example",
        phone: "050-2222222",
        email: "business-card@example.test",
        web: "https://example.test",
        image: { url: "", alt: "" },
        address: {
          state: "",
          country: "test",
          city: "test",
          street: "Main",
          houseNumber: "2",
        },
        bizNumber: 123456,
      },
      {
        title: "Admin Card",
        subtitle: "Admin Business",
        description: "Admin owned business card",
        phone: "050-3333333",
        email: "admin-card@example.test",
        web: "https://admin.example.test",
        image: { url: "", alt: "" },
        address: {
          state: "",
          country: "test",
          city: "test",
          street: "Admin St",
          houseNumber: "3",
        },
        bizNumber: 999999,
      },
    ];

    // Loop over the card data and create each one, linking it to a user //
    for (let i = 0; i < cardsToCreate.length; i++) {
      const user = createdUsers[i];
      const cardData = cardsToCreate[i];
      if (user) {
        await createCardIfNotExists(cardData, user._id);
      }
    }
  } catch (err) {
    console.error("An error occurred during the seed process:", err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  }
}

run();
