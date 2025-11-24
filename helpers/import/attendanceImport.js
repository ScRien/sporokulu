import xlsx from "xlsx";
import Student from "../../models/Student.js";
import Attendance from "../../models/Attendance.js";

export async function importAttendance(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let added = 0;

    for (const row of rows) {
      if (!row.student || !row.date || !row.status) continue;

      const student = await Student.findOne({ name: row.student });
      if (!student) continue;

      await Attendance.create({
        student: student._id,
        date: new Date(row.date),
        status: row.status === "var" ? "var" : "yok",
      });

      added++;
    }

    return { added };
  } catch (err) {
    console.error("Yoklama import hatası:", err);
    throw err;
  }
}
