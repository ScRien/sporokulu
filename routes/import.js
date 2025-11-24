import express from "express";
import { requireAdmin } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

import { importStudents } from "../helpers/import/studentsImport.js";
import { importPayments } from "../helpers/import/paymentsImport.js";
import { importAttendance } from "../helpers/import/attendanceImport.js";

const importRouter = express.Router();

/* --- Öğrenciler --- */
importRouter.post(
  "/admin/import/students",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    const result = await importStudents(req.file.path);
    res.send(`✔ Öğrenci import tamamlandı<br>Eklenen: ${result.added}<br>Güncellenen: ${result.updated}`);
  }
);

/* --- Ödemeler --- */
importRouter.post(
  "/admin/import/payments",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    const result = await importPayments(req.file.path);
    res.send(`✔ Ödeme import tamamlandı<br>Eklenen: ${result.added}<br>Güncellenen: ${result.updated}`);
  }
);

/* --- Yoklama --- */
importRouter.post(
  "/admin/import/attendance",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    const result = await importAttendance(req.file.path);
    res.send(`✔ Yoklama import tamamlandı<br>Eklenen: ${result.added}`);
  }
);

export default importRouter;
