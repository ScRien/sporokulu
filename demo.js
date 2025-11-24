// demo.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB bağlantısı başarılı.");

    const username = "admin";
    const password = "123456";

    // Eğer admin zaten varsa:
    const existing = await User.findOne({ username });
    if (existing) {
      console.log("Admin zaten mevcut.");
      process.exit();
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashed,
      role: "admin"
    });

    console.log("✔ Admin oluşturuldu!");
    console.log("Kullanıcı adı:", username);
    console.log("Şifre:", password);

    process.exit();
  } catch (err) {
    console.error("Hata:", err);
    process.exit(1);
  }
}

createAdmin();
