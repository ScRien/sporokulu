import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    note: String,

    status: {
      type: String,
      enum: ["ödendi", "bekliyor"],
      default: "bekliyor",
    },

    receiptFile: {
      type: String,
    },

    receiptNumber: {
      type: String,
      default: null,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
