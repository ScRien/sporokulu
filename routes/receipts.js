import express from "express";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import { requireAdmin } from "../middlewares/auth.js";

const receiptsRouter = express.Router();

/* -------------------------------------------
   MAKBUZ LİSTELEME
--------------------------------------------*/
receiptsRouter.get("/admin/receipts", requireAdmin, async (req, res) => {
  const { month, year, student, status, receipt } = req.query;

  const filter = {};

  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status && status !== "all") filter.status = status;
  if (student && student !== "all") filter.student = student;

  // 🔍 Makbuz No arama
  if (receipt) {
    filter.receiptNumber = { $regex: receipt, $options: "i" };
  }

  const payments = await Payment.find(filter)
    .populate("student")
    .sort({ date: -1 });

  const students = await Student.find().sort({ name: 1 });

  res.render("pages/receipts/list", {
    title: "Makbuzlar",
    payments,
    students,
    month,
    year,
    selectedStudent: student || "all",
    selectedStatus: status || "all",
    receipt, // ← View'a aktarıyoruz
    active: "receipts",
  });
});

export default receiptsRouter;
