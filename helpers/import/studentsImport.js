import xlsx from "xlsx";
import Student from "../../models/Student.js";

export async function importStudents(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let added = 0;
    let updated = 0;

    for (const row of rows) {
      if (!row.name) continue; // zorunlu

      const existing = await Student.findOne({ name: row.name });

      const studentData = {
        name: row.name,
        age: row.age,
        gender: row.gender,
        birthDate: row.birthDate ? new Date(row.birthDate) : null,
        phone: row.phone,
        address: row.address,
        city: row.city,
        district: row.district,
        branch: row.branch,
        level: row.level,
        status: row.status || "aktif",
        monthlyFee: row.monthlyFee || 0,

        mother: {
          name: row["mother.name"],
          phone: row["mother.phone"],
          email: row["mother.email"],
        },
        father: {
          name: row["father.name"],
          phone: row["father.phone"],
          email: row["father.email"],
        },
        guardian: {
          name: row["guardian.name"],
          phone: row["guardian.phone"],
          relation: row["guardian.relation"],
        },
      };

      if (existing) {
        await Student.findByIdAndUpdate(existing._id, studentData);
        updated++;
      } else {
        await Student.create(studentData);
        added++;
      }
    }

    return { added, updated };

  } catch (err) {
    console.error("Öğrenci import hatası:", err);
    throw err;
  }
}
