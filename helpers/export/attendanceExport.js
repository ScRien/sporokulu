import ExcelJS from "exceljs";

export async function exportAttendanceExcel(records, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Yoklamalar");

  sheet.columns = [
    { header: "Öğrenci", key: "student", width: 30 },
    { header: "Durum", key: "status", width: 15 },
    { header: "Tarih", key: "date", width: 20 }
  ];

  records.forEach((r) => {
    sheet.addRow({
      student: r.student?.name,
      status: r.status === "var" ? "VAR" : "YOK",
      date: new Date(r.date).toLocaleDateString("tr-TR"),
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=yoklama.xlsx");

  await workbook.xlsx.write(res);
  res.end();
}
