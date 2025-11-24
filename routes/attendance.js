import express from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { requireAdmin } from "../middlewares/auth.js";
import { exportAttendanceExcel } from "../helpers/export/attendanceExport.js";
import PDFDocument from "pdfkit";
import { exportAttendancePDF } from "../helpers/export/attendancePDF.js";
import fs from "fs";

const attendanceRouter = express.Router();

/* -----------------------------  
   1) Günlük Yoklama Sayfası
------------------------------*/
attendanceRouter.get("/admin/attendance", requireAdmin, async (req, res) => {
  const students = await Student.find({ status: "aktif" }).sort({ name: 1 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAttendance = await Attendance.find({
    date: { $gte: todayStart, $lte: todayEnd },
  }).populate("student");

  res.render("pages/attendance/take", {
    title: "Günlük Yoklama",
    students,
    todayAttendance,
    active: "attendance",
  });
});

/* -----------------------------  
   2) Günlük Yoklama Kaydet
------------------------------*/
attendanceRouter.post("/admin/attendance", requireAdmin, async (req, res) => {
  const { attendance } = req.body;
  if (!attendance) return res.redirect("/admin/attendance");

  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));

  for (const studentId in attendance) {
    const status = attendance[studentId];

    const exists = await Attendance.findOne({
      student: studentId,
      date: { $gte: start, $lte: end },
    });

    if (!exists) {
      await Attendance.create({
        student: studentId,
        status,
        date: new Date(),
      });
    }
  }

  res.redirect("/admin/attendance");
});

/* -----------------------------  
   3) Toplu Yoklama Sayfası
------------------------------*/
attendanceRouter.get(
  "/admin/attendance/bulk",
  requireAdmin,
  async (req, res) => {
    const branches = ["Futbol", "Basketbol", "Yüzme", "Voleybol"];
    const selectedBranch = req.query.branch || null;

    const students = selectedBranch
      ? await Student.find({ branch: selectedBranch, status: "aktif" }).sort({
          name: 1,
        })
      : await Student.find({ status: "aktif" }).sort({ name: 1 });

    res.render("pages/attendance/bulk", {
      title: "Toplu Yoklama",
      branches,
      students,
      selectedBranch,
      active: "attendance",
    });
  }
);

/* -----------------------------  
   4) Toplu Yoklama Kaydet
------------------------------*/
attendanceRouter.post(
  "/admin/attendance/bulk",
  requireAdmin,
  async (req, res) => {
    const { attendance } = req.body;
    if (!attendance) return res.redirect("/admin/attendance/bulk");

    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    for (const studentId in attendance) {
      const status = attendance[studentId];

      const exists = await Attendance.findOne({
        student: studentId,
        date: { $gte: start, $lte: end },
      });

      if (!exists) {
        await Attendance.create({
          student: studentId,
          status,
          date: new Date(),
        });
      }
    }

    res.redirect("/admin/attendance");
  }
);

/* -----------------------------  
   5) Yoklama Durumunu Değiştir
------------------------------*/
attendanceRouter.post(
  "/admin/attendance/:id/toggle",
  requireAdmin,
  async (req, res) => {
    const att = await Attendance.findById(req.params.id);
    if (!att) return res.redirect("back");

    att.status = att.status === "var" ? "yok" : "var";
    await att.save();

    res.redirect("back");
  }
);

/* -----------------------------  
   6) Yoklama Sil
------------------------------*/
attendanceRouter.post(
  "/admin/attendance/:id/delete",
  requireAdmin,
  async (req, res) => {
    await Attendance.findByIdAndDelete(req.params.id);
    res.redirect("back");
  }
);

/* -------------------------------------------  
   7) Yoklama Geçmişi
--------------------------------------------*/
attendanceRouter.get(
  "/admin/attendance/history",
  requireAdmin,
  async (req, res) => {
    const { start, end, student, branch } = req.query;

    const filter = {};
    const studentFilter = {};

    // ── Tarih filtresi
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    // ── Öğrenci filtresi
    if (student && student !== "all") filter.student = student;

    // ── Branş filtresi
    if (branch && branch !== "all") studentFilter.branch = branch;

    const students = await Student.find(studentFilter).sort({ name: 1 });

    const attendance = await Attendance.find(filter)
      .populate("student")
      .sort({ date: -1 });

    // ── Toplamlar
    const totalPresent = attendance.filter((a) => a.status === "var").length;
    const totalAbsent = attendance.filter((a) => a.status === "yok").length;

    res.render("pages/attendance/history", {
      title: "Yoklama Geçmişi",
      attendance,
      students,
      selectedStudent: student || "all",
      selectedBranch: branch || "all",
      start,
      end,
      totalPresent,
      totalAbsent,
      active: "attendance",
    });
  }
);

/* -------------------------------------------  
   8) Excel Export
--------------------------------------------*/
attendanceRouter.get(
  "/admin/attendance/export/excel",
  requireAdmin,
  async (req, res) => {
    const records = await Attendance.find().populate("student");
    exportAttendanceExcel(records, res);
  }
);

/* -------------------------------------------  
   9) PDF Export
--------------------------------------------*/
attendanceRouter.get("/admin/attendance/export/pdf", requireAdmin, async (req, res) => {
  const records = await Attendance.find().populate("student").sort({ date: -1 });

  const doc = new PDFDocument({ margin: 40 });

  // Türkçe font yükle
  doc.registerFont("tr", "fonts/DejaVuSans.ttf");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=yoklama.pdf");

  doc.pipe(res);

  // Başlık
  doc.font("tr").fontSize(22).text("YOKLAMA DÖKÜMÜ", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text("Oluşturulma Tarihi: " + new Date().toLocaleDateString("tr-TR"), {
    align: "center"
  });
  doc.moveDown(2);

  // Tablo başlıkları
  const top = doc.y;

  doc.fontSize(13).font("tr").text("Öğrenci", 40, top);
  doc.text("Branş", 200, top);
  doc.text("Durum", 300, top);
  doc.text("Tarih", 380, top);

  // Çizgi
  doc.moveTo(40, top + 18)
     .lineTo(550, top + 18)
     .stroke();

  let y = top + 30;

  records.forEach((r) => {
    doc.font("tr").fontSize(12);
    doc.text(r.student?.name || "-", 40, y);
    doc.text(r.student?.branch || "-", 200, y);
    doc.text(r.status === "var" ? "VAR" : "YOK", 300, y);
    doc.text(new Date(r.date).toLocaleDateString("tr-TR"), 380, y);

    y += 25;
    if (y > 750) {
      doc.addPage();
      y = 40;
    }
  });

  doc.end();
});


export default attendanceRouter;
