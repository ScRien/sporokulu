import moment from "moment";
import "moment/locale/tr.js";

moment.locale("tr");

export default {
  // ============================
  // Tarih Formatlama
  // ============================
  formatDate(date) {
    if (!date) return "-";
    return moment(date).format("DD MMMM YYYY HH:mm");
  },

  // ============================
  // Yıl
  // ============================
  year() {
    return new Date().getFullYear();
  },

  // ============================
  // Eşitlik kontrolü
  // ============================
  eq(a, b) {
    return a === b;
  },

  // ============================
  // Dizi oluşturma
  // ör: (array 1 5) => [1,5]
  // ============================
  array(...args) {
    args.pop(); // Handlebars options'ı at
    return args;
  },

  // ============================
  // Ay Adı
  // ============================
  monthName(m) {
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
    return months[m];
  },

  // ============================
  // JSON
  // ============================
  json(context) {
    return JSON.stringify(context);
  },

  // ============================
  // Range oluşturma
  // ör: (range 1 12)
  // ============================
  range(from, to) {
    const arr = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  },
};
