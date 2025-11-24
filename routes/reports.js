import express from "express";
import Payment from "../models/Payment.js";
import { requireAdmin } from "../middlewares/auth.js";

const reportsRouter = express.Router();


// ========== RAPORLAR ANA SAYFASI ==========
reportsRouter.get("/admin/reports", requireAdmin, async (req, res) => {
  // Aylık toplam ödenen
  const payments = await Payment.find({ status: "ödendi" });

  // Gruplama için map
  const monthlyTotals = {};

  payments.forEach((p) => {
    const key = `${p.month}-${p.year}`;
    if (!monthlyTotals[key]) monthlyTotals[key] = 0;
    monthlyTotals[key] += p.amount;
  });

  res.render("pages/reports/index", {
    title: "Gelir Raporları",
    monthlyTotals: JSON.stringify(monthlyTotals),
  });
});

reportsRouter.get("/admin/reports", requireAdmin, async (req, res) => {
  const { year = new Date().getFullYear(), month = null } = req.query;

  const filter = { status: "ödendi" };
  
  if (month) filter.month = Number(month);
  filter.year = Number(year);

  const payments = await Payment.find(filter);

  // Toplam ödenen
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // Toplam bekleyen
  const pendingPayments = await Payment.find({
    status: "bekliyor",
    month: filter.month,
    year: filter.year
  });

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Öğrenci sayısı
  const uniqueStudents = new Set(payments.map(p => p.student.toString()));
  const totalStudentsPaid = uniqueStudents.size;

  // Branş bazlı gelir
  const branchTotals = {};

  for (const p of payments) {
    const student = await Student.findById(p.student);
    const branch = student.branch;

    if (!branchTotals[branch]) branchTotals[branch] = 0;
    branchTotals[branch] += p.amount;
  }

  res.render("pages/reports/index", {
    title: "Gelir Raporları",
    year,
    month,
    totalPaid,
    totalPending,
    totalStudentsPaid,
    branchTotals: JSON.stringify(branchTotals)
  });
});

export default reportsRouter;
