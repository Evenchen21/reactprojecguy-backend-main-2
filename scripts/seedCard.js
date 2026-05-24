require("dotenv").config();
const mongoose = require("mongoose");
const Card = require("../models/cards"); // Import the Card model //

// This script connects to the database and adds one sample card //
async function run() {
  try {
    const uri = process.env.DB_HOST;
    if (!uri) {
      throw new Error("DB_HOST not set in environment. Check your .env file.");
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const sampleCard = {
      title: "test123",
      subtitle: "testing",
      description: "testing 123",
      phone: "050-0000000",
      email: "testing@gmail.com",
      web: "https://www.test.co.il",
      image: {
        url: "https://cdn.pixabay.com/photo/2016/04/20/08/21/entrepreneur-1340649_960_720.jpg",
        alt: "business card image",
      },
      address: {
        state: "not defined",
        country: "test",
        city: "test",
        street: "test",
        houseNumber: 3,
        zip: 0,
      },
      bizNumber: 6401563,
      likes: [],
      createdAt: new Date(),
    };

    // Using the Card model to create a new document //
    const newCard = await Card.create(sampleCard);
    console.log("Inserted document id:", newCard._id.toString());
  } catch (err) {
    console.error("An error occurred during the seed process:", err.message);
  } finally {
    // Make sure we disconnect from the DB when done //
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected");
    }
  }
}

run();
