import xlsx from "xlsx";
import Payment from "../../models/Payment.js";
import Student from "../../models/Student.js";

export async function importPayments(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let added = 0;
    let updated = 0;

    for (const row of rows) {
      if (!row.student) continue;

      const student = await Student.findOne({ name: row.student });
      if (!student) continue;

      const filter = {
        student: student._id,
        month: row.month,
        year: row.year,
      };

      const paymentData = {
        student: student._id,
        amount: row.amount || 0,
        status: row.status || "bekliyor",
        note: row.note || "",
        month: row.month,
        year: row.year,
        date: row.date ? new Date(row.date) : new Date(),
      };

      const existing = await Payment.findOne(filter);

      if (existing) {
        await Payment.findByIdAndUpdate(existing._id, paymentData);
        updated++;
      } else {
        await Payment.create(paymentData);
        added++;
      }
    }

    return { added, updated };
  } catch (err) {
    console.error("Ödeme import hatası:", err);
    throw err;
  }
}
