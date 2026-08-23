require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const EMAIL = "tochukwupascal614@gmail.com";

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({
      email: EMAIL.toLowerCase()
    });

    if (!user) {
      console.log("User not found:", EMAIL);
      return;
    }

    user.role = "admin";

    await user.save();

    console.log("Admin role assigned successfully.");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);

  } catch (error) {
    console.error("MAKE ADMIN ERROR:", error.message);

  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();