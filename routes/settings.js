import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import { requireAdmin } from "../middlewares/auth.js";
import { generateReceipt } from "../helpers/receiptGenerator.js";
import path from "path";
import fs from "fs";

const settingsRouter = express.Router();

// ========== AYARLAR SAYFASI ==========
settingsRouter.get("/admin/settings", requireAdmin, async (req, res) => {
  const admin = await User.findById(req.session.user.id);

  res.render("pages/settings/index", {
    title: "Ayarlar",
    admin,
    active: "settings",
  });
});

// ========== ŞİFRE GÜNCELLE ==========
settingsRouter.post(
  "/admin/settings/password",
  requireAdmin,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(req.session.user.id);

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.render("pages/settings/index", {
        title: "Ayarlar",
        admin,
        error: "Mevcut şifre yanlış!",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    admin.password = hashed;
    await admin.save();

    res.render("pages/settings/index", {
      title: "Ayarlar",
      admin,
      success: "Şifre başarıyla güncellendi!",
    });
  }
);

settingsRouter.post("/admin/settings/regenerate-receipts", requireAdmin, async (req, res) => {
  const payments = await Payment.find().populate("student");

  let count = 0;

  for (const p of payments) {
    const student = p.student;
    const fileName = generateReceipt(p, student);

    p.receiptFile = fileName;
    await p.save();

    count++;
  }

  res.render("pages/settings/index", {
    title: "Ayarlar",
    message: `${count} makbuz başarıyla yeniden oluşturuldu.`,
  });
});

/* -------------------------------------------
   Tüm Makbuzları Yeniden Oluştur
--------------------------------------------*/
settingsRouter.post(
  "/admin/settings/regenerate-all-receipts",
  requireAdmin,
  async (req, res) => {
    try {
      const payments = await Payment.find().populate("student");

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

      res.redirect("/admin/settings");

    } catch (err) {
      console.error("Makbuz yenileme hatası:", err);
      res.send("Hata: " + err.message);
    }
  }
);

export default settingsRouter;
