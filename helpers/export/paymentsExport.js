import ExcelJS from "exceljs";

export async function exportPaymentsExcel(payments, res, fileName = "odemeler.xlsx") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ödemeler");

  sheet.columns = [
    { header: "Öğrenci", key: "student", width: 30 },
    { header: "Tutar (₺)", key: "amount", width: 15 },
    { header: "Durum", key: "status", width: 15 },
    { header: "Ay", key: "month", width: 8 },
    { header: "Yıl", key: "year", width: 8 },
    { header: "Tarih", key: "date", width: 20 },
    { header: "Not", key: "note", width: 30 }
  ];

  payments.forEach((p) => {
    sheet.addRow({
      student: p.student?.name || "—",
      amount: p.amount,
      status: p.status,
      month: p.month,
      year: p.year,
      date: new Date(p.date).toLocaleDateString("tr-TR"),
      note: p.note || "",
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

  await workbook.xlsx.write(res);
  res.end();
}
