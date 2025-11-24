import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// DejaVuSans font dosyasının yolu
const fontPath = path.join("public", "fonts", "DejaVuSans.ttf");

export function generateReceipt(payment, student) {
  // Makbuz klasörünü oluştur
  const receiptDir = path.join("public", "receipts");
  if (!fs.existsSync(receiptDir)) {
    fs.mkdirSync(receiptDir, { recursive: true });
  }

  // Dosya adı
  const fileName = `receipt_${payment._id}.pdf`;
  const filePath = path.join(receiptDir, fileName);

  // PDF oluştur
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  doc.pipe(fs.createWriteStream(filePath));

  // Türkçe destekli font
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  }

  // ----- Başlık -----
  doc.fontSize(24).text("ÖDEME MAKBUZU", { align: "center" }).moveDown(2);

  // 🔥 Makbuz No
  doc.fontSize(12).text(`Makbuz No: ${payment.receiptNumber}`);
  doc.moveDown(0.5);

  // ----- Fatura No -----
  doc.fontSize(12);
  doc.text(`Fatura No: ${payment._id}`);
  doc.text(`Tarih: ${new Date(payment.date).toLocaleString("tr-TR")}`);
  doc.moveDown();

  // ----- Öğrenci Bilgileri -----
  doc.fontSize(14).text("Öğrenci Bilgileri", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(12);
  doc.text(`Ad Soyad: ${student.name}`);
  doc.text(`Branş: ${student.branch}`);
  doc.text(`Öğrenci ID: ${student._id}`);
  doc.moveDown();

  // ----- Ödeme Bilgileri -----
  doc.fontSize(14).text("Ödeme Bilgileri", { underline: true });
  doc.moveDown(0.5);

  const months = [
    "",
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const monthName = months[payment.month];

  doc.fontSize(12);
  doc.text(`Ay / Yıl: ${monthName} ${payment.year}`);
  doc.text(`Tutar: ${payment.amount} ₺`);
  doc.text(`Durum: ${payment.status === "ödendi" ? "Ödendi" : "Bekliyor"}`);
  doc.text(
    `Ödeme Tarihi: ${new Date(payment.date).toLocaleDateString("tr-TR")}`
  );

  if (payment.note) {
    doc.moveDown();
    doc.text(`Not: ${payment.note}`);
  }

  // ----- Alt bilgi -----
  doc.moveDown(3);
  doc
    .fontSize(10)
    .text(
      "Bu makbuz Spor Okulu Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.",
      {
        align: "center",
      }
    );

  doc.end();

  return fileName;
}
