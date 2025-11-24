import ExcelJS from "exceljs";

export async function exportStudentsExcel(students, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Öğrenciler");

  sheet.columns = [
    { header: "Ad Soyad", key: "name", width: 30 },
    { header: "Yaş", key: "age", width: 10 },
    { header: "Cinsiyet", key: "gender", width: 12 },
    { header: "Branş", key: "branch", width: 20 },
    { header: "Seviye", key: "level", width: 15 },
    { header: "Durum", key: "status", width: 15 },
    { header: "Telefon", key: "phone", width: 20 },
    { header: "Şehir", key: "city", width: 20 },
    { header: "İlçe", key: "district", width: 20 },
    { header: "Kayıt Tarihi", key: "startDate", width: 20 }
  ];

  students.forEach((s) => {
    sheet.addRow({
      name: s.name,
      age: s.age,
      gender: s.gender,
      branch: s.branch,
      level: s.level,
      status: s.status,
      phone: s.phone,
      city: s.city,
      district: s.district,
      startDate: new Date(s.startDate).toLocaleDateString("tr-TR"),
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=ogrenciler.xlsx");

  await workbook.xlsx.write(res);
  res.end();
}
