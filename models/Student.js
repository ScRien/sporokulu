import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // Temel Bilgiler
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["Erkek", "Kız"] },
    birthDate: { type: Date },

    // Veli Bilgileri
    mother: {
      name: String,
      phone: String,
      email: String,
    },

    father: {
      name: String,
      phone: String,
      email: String,
    },

    guardian: {
      name: String,
      phone: String,
      relation: String, // Teyze, Amca, Dede vs.
    },

    // İletişim
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    district: { type: String },

    // Spor Bilgileri
    branch: { type: String, required: true }, // branş
    level: { type: String },                 // başlangıç, orta, ileri
    status: { type: String, default: "aktif" },

    // Ücretlendirme
    monthlyFee: { type: Number }, // Aylık ücret
    notes: { type: String },

    // Kayıt Tarihi
    startDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
