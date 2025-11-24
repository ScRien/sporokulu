import PDFDocument from "pdfkit";

export function exportAttendancePDF(records, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=yoklama.pdf"
  );

  doc.pipe(res);

  /* -----------------------------
     BAŞLIK
  ------------------------------*/
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("YOKLAMA DÖKÜMÜ", { align: "center" });

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      "Oluşturulma Tarihi: " +
        new Date().toLocaleDateString("tr-TR"),
      { align: "center" }
    );

  doc.moveDown(1.2);

  /* -----------------------------
     TABLO BAŞLIKALARI
  ------------------------------*/
  const tableTop = 140;
  const col1 = 40;  // Öğrenci
  const col2 = 250; // Branş
  const col3 = 360; // Durum
  const col4 = 440; // Tarih

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Öğrenci", col1, tableTop)
    .text("Branş", col2, tableTop)
    .text("Durum", col3, tableTop)
    .text("Tarih", col4, tableTop);

  // Alt çizgi
  doc
    .moveTo(40, tableTop + 18)
    .lineTo(550, tableTop + 18)
    .stroke();

  /* -----------------------------
     TABLO SATIRLARI
  ------------------------------*/
  let y = tableTop + 30;
  doc.font("Helvetica").fontSize(11);

  records.forEach((r) => {
    if (y > 760) {
      doc.addPage();

      // Yeni sayfada tekrar başlık oluştur
      y = 40;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Öğrenci", col1, y)
        .text("Branş", col2, y)
        .text("Durum", col3, y)
        .text("Tarih", col4, y);

      doc
        .moveTo(40, y + 18)
        .lineTo(550, y + 18)
        .stroke();

      y += 30;
    }

    // Veriler
    doc.text(r.student?.name || "-", col1, y);
    doc.text(r.student?.branch || "-", col2, y);
    doc.text(r.status === "var" ? "VAR" : "YOK", col3, y);
    doc.text(
      new Date(r.date).toLocaleDateString("tr-TR"),
      col4,
      y
    );

    y += 25;
  });

  doc.end();
}
