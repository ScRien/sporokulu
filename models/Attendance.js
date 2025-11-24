import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    status: {
      type: String,
      enum: ["var", "yok"],
      required: true,
    },
  },
  { timestamps: true }
);

// Aynı öğrenci için aynı gün 2 yoklamayı engelle
attendanceSchema.index(
  { student: 1, date: 1 },
  { unique: false } // aynı gün aralığını router kontrol ediyor
);

export default mongoose.model("Attendance", attendanceSchema);
