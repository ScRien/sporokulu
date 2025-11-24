import express from "express";
import Student from "../models/Student.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import { requireAdmin } from "../middlewares/auth.js";
import path from "path";
import fs from "fs";

const studentRouter = express.Router();

/* -------------------------------------------
   1) Öğrenci Listesi
--------------------------------------------*/
studentRouter.get("/admin/students", requireAdmin, async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });

  res.render("pages/students/list", {
    title: "Öğrenci Listesi",
    students,
    active: "students",
  });
});

/* -------------------------------------------
   2) Yeni Öğrenci Ekleme Sayfası
--------------------------------------------*/
studentRouter.get("/admin/students/new", requireAdmin, (req, res) => {
  res.render("pages/students/new", {
    title: "Yeni Öğrenci Ekle",
  });
});

/* -------------------------------------------
   3) Yeni Öğrenci POST
--------------------------------------------*/
studentRouter.post("/admin/students", requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    await Student.create({
      name: data.name,
      age: data.age,
      gender: data.gender,
      birthDate: data.birthDate,

      mother: {
        name: data["mother.name"],
        phone: data["mother.phone"],
        email: data["mother.email"],
      },

      father: {
        name: data["father.name"],
        phone: data["father.phone"],
        email: data["father.email"],
      },

      guardian: {
        name: data["guardian.name"],
        phone: data["guardian.phone"],
        relation: data["guardian.relation"],
      },

      phone: data.phone,
      address: data.address,
      city: data.city,
      district: data.district,

      branch: data.branch,
      level: data.level,
      status: data.status,
      notes: data.notes,
      monthlyFee: data.monthlyFee,
    });

    res.redirect("/admin/students");
  } catch (err) {
    console.error("Öğrenci ekleme hatası:", err);
    res.render("pages/students/new", {
      title: "Yeni Öğrenci Ekle",
      error: "Bir hata oluştu. Lütfen bilgileri kontrol edin.",
    });
  }
});

/* -------------------------------------------
   4) Öğrenci Düzenleme Sayfası
--------------------------------------------*/
studentRouter.get(
  "/admin/students/:id/edit",
  requireAdmin,
  async (req, res) => {
    const student = await Student.findById(req.params.id);

    res.render("pages/students/edit", {
      title: "Öğrenciyi Düzenle",
      student,
    });
  }
);

/* -------------------------------------------
   5) Öğrenci Güncelle POST
--------------------------------------------*/
studentRouter.post("/admin/students/:id", requireAdmin, async (req, res) => {
  try {
    const data = req.body;

    await Student.findByIdAndUpdate(req.params.id, {
      name: data.name,
      age: data.age,
      gender: data.gender,
      birthDate: data.birthDate,

      mother: {
        name: data["mother.name"],
        phone: data["mother.phone"],
        email: data["mother.email"],
      },

      father: {
        name: data["father.name"],
        phone: data["father.phone"],
        email: data["father.email"],
      },

      guardian: {
        name: data["guardian.name"],
        phone: data["guardian.phone"],
        relation: data["guardian.relation"],
      },

      phone: data.phone,
      address: data.address,
      city: data.city,
      district: data.district,

      branch: data.branch,
      level: data.level,
      status: data.status,
      notes: data.notes,
      monthlyFee: data.monthlyFee,
    });

    res.redirect("/admin/students");
  } catch (err) {
    console.error("Öğrenci güncelleme hatası:", err);

    res.render("pages/students/edit", {
      title: "Öğrenciyi Düzenle",
      student: await Student.findById(req.params.id),
      error: "Güncelleme sırasında bir hata oluştu.",
    });
  }
});

/* -------------------------------------------
   6) Öğrenci Sil
--------------------------------------------*/
studentRouter.post(
  "/admin/students/:id/delete",
  requireAdmin,
  async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect("/admin/students");
  }
);

/* -------------------------------------------
   7) Öğrenci Detay Sayfası (Profil)
--------------------------------------------*/
studentRouter.get("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;

  const student = await Student.findById(id);
  const payments = await Payment.find({ student: id }).sort({ date: -1 });
  const attendance = await Attendance.find({ student: id }).sort({ date: -1 });

  const totalPaid = payments
    .filter((p) => p.status === "ödendi")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "bekliyor")
    .reduce((sum, p) => sum + p.amount, 0);

  const attendancePresent = attendance.filter((a) => a.status === "var").length;
  const attendanceAbsent = attendance.filter((a) => a.status === "yok").length;

  // 📌 Bu ay - yıl bilgisi
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 📌 Bu ayın ödemesi
  const currentMonthPayment = await Payment.findOne({
    student: id,
    month: currentMonth,
    year: currentYear
  });

  res.render("pages/students/detail", {
    title: `${student.name} - Profil`,
    student,
    payments,
    attendance,
    totalPaid,
    totalPending,
    attendancePresent,
    attendanceAbsent,

    // 👇 Eksik olanlar eklendi!
    currentMonth,
    currentYear,
    currentMonthPayment,
  });
});

import { exportStudentsExcel } from "../helpers/export/studentsExport.js";
import { generateReceipt } from "../helpers/receiptGenerator.js";

studentRouter.get("/admin/students/export/excel", requireAdmin, async (req, res) => {
  const students = await Student.find();
  exportStudentsExcel(students, res);
});

studentRouter.post(
  "/admin/students/:id/regenerate-receipts",
  requireAdmin,
  async (req, res) => {

    const id = req.params.id;
    const payments = await Payment.find({ student: id }).populate("student");

    for (const p of payments) {
      // Eski PDF varsa sil
      if (p.receiptFile) {
        const filePath = path.join("public", "receipts", p.receiptFile);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      // Yeni PDF üret
      const newFileName = await generateReceipt(p, p.student);

      p.receiptFile = newFileName;
      await p.save();
    }

    res.redirect(`/admin/students/${id}`);
  }
);


export default studentRouter;
