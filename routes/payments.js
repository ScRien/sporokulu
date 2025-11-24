import express from "express";
import fs from "fs";
import path from "path";

import Payment from "../models/Payment.js";
import Student from "../models/Student.js";

import { requireAdmin } from "../middlewares/auth.js";
import { generateReceipt } from "../helpers/receiptGenerator.js";
import { generateReceiptNumber } from "../helpers/receiptNumber.js";
import { exportPaymentsExcel } from "../helpers/export/paymentsExport.js";

const paymentsRouter = express.Router();

/* -------------------------------------------
   1) Ödeme Listesi
--------------------------------------------*/
paymentsRouter.get("/admin/payments", requireAdmin, async (req, res) => {
  const payments = await Payment.find().populate("student").sort({ date: -1 });

  res.render("pages/payments/list", {
    title: "Tüm Ödemeler",
    payments,
    filterTitle: "📄 Tüm Ödemeler",
    active: "payments",
  });
});

/* -------------------------------------------
   2) Yeni Ödeme Formu
--------------------------------------------*/
paymentsRouter.get("/admin/payments/new", requireAdmin, async (req, res) => {
  const students = await Student.find().sort({ name: 1 });

  res.render("pages/payments/new", {
    title: "Ödeme Ekle",
    students,
    selectedStudent: req.query.student || null,
    active: "payments",
  });
});

/* -------------------------------------------
   3) Yeni Ödeme POST
--------------------------------------------*/
paymentsRouter.post("/admin/payments", requireAdmin, async (req, res) => {
  try {
    const { student, amount, status, note, month, year } = req.body;

    const studentData = await Student.findById(student);
    if (!studentData) throw new Error("Öğrenci bulunamadı.");

    // 🔒 Aynı ayda ikinci ödeme engeli
    const exists = await Payment.findOne({ student, month, year });
    if (exists) {
      return res.send("Bu öğrenci için bu ay zaten bir ödeme/makbuz mevcut.");
    }

    // Makbuz numarası üret
    const receiptNumber = await generateReceiptNumber(month, year);

    // Ödeme kaydı
    const payment = await Payment.create({
      student,
      amount,
      status,
      note,
      month,
      year,
      date: new Date(),
      receiptNumber,
    });

    // PDF Makbuz oluştur
    const pdfName = await generateReceipt(payment, studentData);
    payment.receiptFile = pdfName;
    await payment.save();

    res.redirect("/admin/payments");

  } catch (err) {
    console.error(err);
    res.send("Hata: " + err.message);
  }
});

/* -------------------------------------------
   4) Ödeme + Makbuz Sil
--------------------------------------------*/
paymentsRouter.post("/admin/payments/:id/delete", requireAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.redirect("/admin/payments");

  // PDF sil
  if (payment.receiptFile) {
    const filePath = path.join("public", "receipts", payment.receiptFile);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await Payment.findByIdAndDelete(payment._id);
  res.redirect("/admin/payments");
});

/* -------------------------------------------
   5) Ödeme Dashboard
--------------------------------------------*/
paymentsRouter.get("/admin/payments/dashboard", requireAdmin, async (req, res) => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const allPayments = await Payment.find();
  const thisMonthPayments = await Payment.find({ month, year });

  const totalPaid = thisMonthPayments
    .filter(p => p.status === "ödendi")
    .reduce((s, p) => s + p.amount, 0);

  const totalPending = thisMonthPayments
    .filter(p => p.status === "bekliyor")
    .reduce((s, p) => s + p.amount, 0);

  const paidCount = thisMonthPayments.filter(p => p.status === "ödendi").length;
  const pendingCount = thisMonthPayments.filter(p => p.status === "bekliyor").length;

  const monthlyTotals = {};
  allPayments.forEach(p => {
    const key = `${p.month}/${p.year}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + (p.status === "ödendi" ? p.amount : 0);
  });

  res.render("pages/payments/dashboard", {
    title: "Ödeme Paneli",
    active: "payments",
    totalPaid,
    totalPending,
    paidCount,
    pendingCount,
    month,
    year,
    monthlyLabels: Object.keys(monthlyTotals),
    monthlyValues: Object.values(monthlyTotals)
  });
});

/* -------------------------------------------
   6) Bekleyen / Ödenmiş
--------------------------------------------*/
paymentsRouter.get("/admin/payments/pending", requireAdmin, async (req, res) => {
  const payments = await Payment.find({ status: "bekliyor" })
    .populate("student")
    .sort({ date: -1 });

  res.render("pages/payments/list", {
    title: "Bekleyen Ödemeler",
    payments,
    filterTitle: "🟡 Bekleyen Ödemeler",
    active: "payments",
  });
});

paymentsRouter.get("/admin/payments/paid", requireAdmin, async (req, res) => {
  const payments = await Payment.find({ status: "ödendi" })
    .populate("student")
    .sort({ date: -1 });

  res.render("pages/payments/list", {
    title: "Ödenmiş Ödemeler",
    payments,
    filterTitle: "🟢 Ödenmiş Ödemeler",
    active: "payments",
  });
});

/* -------------------------------------------
   7) Aylık Ödemeler
--------------------------------------------*/
paymentsRouter.get("/admin/payments/monthly", requireAdmin, async (req, res) => {
  const month = Number(req.query.month) || (new Date().getMonth() + 1);
  const year = Number(req.query.year) || new Date().getFullYear();

  const payments = await Payment.find({ month, year })
    .populate("student")
    .sort({ "student.name": 1 });

  res.render("pages/payments/monthly", {
    title: "Aylık Ödemeler",
    payments,
    month,
    year,
    active: "payments"
  });
});

/* -------------------------------------------
   8) Hızlı Ödeme
--------------------------------------------*/
paymentsRouter.post("/admin/payments/mark-paid", requireAdmin, async (req, res) => {
  const { studentId, month, year } = req.body;

  let payment = await Payment.findOne({ student: studentId, month, year });

  if (!payment) {
    const receiptNumber = await generateReceiptNumber(month, year);

    payment = await Payment.create({
      student: studentId,
      month,
      year,
      amount: 0,
      status: "ödendi",
      note: "Hızlı ödeme",
      date: new Date(),
      receiptNumber,
    });
  } else {
    payment.status = "ödendi";
    payment.date = new Date();
    await payment.save();
  }

  res.redirect(`/admin/students/${studentId}`);
});

/* -------------------------------------------
   9) Ödeme Detay
--------------------------------------------*/
paymentsRouter.get("/admin/payments/:id", requireAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("student");

  if (!payment) return res.redirect("/admin/payments");

  res.render("pages/payments/detail", {
    title: "Ödeme Detayı",
    payment,
    student: payment.student,
    active: "payments",
  });
});

// -------------------------------------------
// 10) Excel Export - Tüm Ödemeler
// -------------------------------------------
paymentsRouter.get("/admin/payments/export/excel", requireAdmin, async (req, res) => {
  const payments = await Payment.find().populate("student");
  exportPaymentsExcel(payments, res, "tum_odemeler.xlsx");
});

// -------------------------------------------
// 11) Aylık Excel Export
// -------------------------------------------
paymentsRouter.get("/admin/payments/export/monthly", requireAdmin, async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  const payments = await Payment.find({ month, year }).populate("student");
  exportPaymentsExcel(payments, res, `odemeler_${month}_${year}.xlsx`);
});

paymentsRouter.post(
  "/admin/payments/:id/mark-paid",
  requireAdmin,
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.redirect("/admin/payments");

      payment.status = "ödendi";
      payment.date = new Date();
      await payment.save();

      res.redirect(`/admin/payments/${payment._id}`);
    } catch (err) {
      console.error("Ödeme güncelleme hatası:", err);
      res.redirect("/admin/payments");
    }
  }
);

export default paymentsRouter;
