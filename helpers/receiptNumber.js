// helpers/receiptNumber.js
import Payment from "../models/Payment.js";

export async function generateReceiptNumber(month, year) {
  const count = await Payment.countDocuments({ month, year });

  const seq = (count + 1).toString().padStart(4, "0");

  return `R-${year}-${String(month).padStart(2, "0")}-${seq}`;
}
