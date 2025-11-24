import express from "express";
import { requireAdmin } from "../middlewares/auth.js";
import Student from "../models/Student.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";

const adminRouter = express.Router();

/* -------------------------------------------
   /admin  → Gelişmiş Yönetim Paneli
--------------------------------------------*/
adminRouter.get("/admin", requireAdmin, async (req, res) => {
  // ───────── Öğrenci İstatistikleri ─────────
  const totalStudents = await Student.countDocuments();
  const activeStudents = await Student.countDocuments({ status: "aktif" });

  const activeStudentDocs = await Student.find({ status: "aktif" });

  const branchCounts = {};
  activeStudentDocs.forEach((s) => {
    const b = s.branch || "Diğer";
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  const branchLabels = Object.keys(branchCounts);
  const branchValues = Object.values(branchCounts);

  // ───────── Ödeme İstatistikleri ─────────
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const thisMonthPayments = await Payment.find({
    month: currentMonth,
    year: currentYear,
  });

  const totalPaidThisMonth = thisMonthPayments
    .filter((p) => p.status === "ödendi")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingThisMonth = thisMonthPayments
    .filter((p) => p.status === "bekliyor")
    .reduce((sum, p) => sum + p.amount, 0);

  // Yıllık tahsilat grafiği (ay bazlı)
  const paidAll = await Payment.find({ status: "ödendi" });

  const monthlyMap = {}; // key: YYYY-MM, value: toplam miktar
  paidAll.forEach((p) => {
    if (!p.year || !p.month) return;
    const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + p.amount;
  });

  const monthlyKeys = Object.keys(monthlyMap).sort(); // kronolojik
  const monthlyLabels = monthlyKeys.map((k) => {
    const [y, m] = k.split("-");
    return `${m}/${y}`; // 03/2025 gibi
  });
  const monthlyValues = monthlyKeys.map((k) => monthlyMap[k]);

  // ───────── Yoklama İstatistikleri ─────────
  const attendanceAll = await Attendance.find();

  const totalPresent = attendanceAll.filter((a) => a.status === "var").length;
  const totalAbsent = attendanceAll.filter((a) => a.status === "yok").length;

  // ───────── Son Hareketler ─────────
  const latestPayments = await Payment.find()
    .populate("student")
    .sort({ date: -1 })
    .limit(5);

  const latestAttendance = await Attendance.find()
    .populate("student")
    .sort({ date: -1 })
    .limit(5);

  // Chart.js için JSON stringler
  const branchLabelsJson = JSON.stringify(branchLabels);
  const branchValuesJson = JSON.stringify(branchValues);
  const monthlyLabelsJson = JSON.stringify(monthlyLabels);
  const monthlyValuesJson = JSON.stringify(monthlyValues);

  res.render("pages/admin/dashboard", {
    title: "Yönetim Paneli",
    active: "dashboard",

    // Öğrenci
    totalStudents,
    activeStudents,

    // Ödemeler
    currentMonth,
    currentYear,
    totalPaidThisMonth,
    totalPendingThisMonth,

    // Yoklama
    totalPresent,
    totalAbsent,

    // Son hareketler
    latestPayments,
    latestAttendance,

    // Grafik verileri
    branchLabelsJson,
    branchValuesJson,
    monthlyLabelsJson,
    monthlyValuesJson,
  });
});

export default adminRouter;
