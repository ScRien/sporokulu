import mongoose from "mongoose";
import Payment from "./models/Payment.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/spor_okulu";

await mongoose.connect(MONGO_URI);
console.log("Mongo bağlandı.");

const payments = await Payment.find();

for (const p of payments) {
  let changed = false;

  if (!p.month || p.month === 0) {
    p.month = (p.date ? p.date.getMonth() + 1 : 1);
    changed = true;
  }

  if (!p.year || p.year === 0) {
    p.year = (p.date ? p.date.getFullYear() : 2025);
    changed = true;
  }

  if (changed) {
    await p.save();
    console.log("Fixlendi:", p._id);
  }
}

console.log("Tüm eski ödemeler düzeltildi.");
process.exit();
