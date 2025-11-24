// app.js
import express from "express";
import exphbs from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import moment from "moment";
import "moment/locale/tr.js";

moment.locale("tr");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname tanımı (ESM için)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// MONGODB BAĞLANTISI
// ===============================
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/spor_okulu";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB bağlantısı başarılı");
  })
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err);
  });

// ===============================
// MIDDLEWARELER
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Statik dosyalar (CSS, JS, img)
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// HANDLEBARS AYARLARI
// ===============================
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import Handlebars from "handlebars";

app.engine(
  "handlebars",
  exphbs.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars), // ← kritik satır
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    helpers: {
      year: () => new Date().getFullYear(),

      eq: (a, b) => a === b,

      formatDate: (date) =>
        moment(date).locale("tr").format("DD MMMM YYYY HH:mm"),

      array: (...args) => {
        args.pop(); // Handlebars'ın eklediği options nesnesi
        return args;
      },

      range: (from, to) => {
        const arr = [];
        for (let i = from; i <= to; i++) arr.push(i);
        return arr;
      },

      monthName: (m) => {
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

      json: (context) => JSON.stringify(context),
    },
  })
);

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

import session from "express-session";
import MongoStore from "connect-mongo";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import studentRouter from "./routes/student.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";
import attendanceRouter from "./routes/attendance.js";
import reportsRouter from "./routes/reports.js";
import handlebarsHelpers from "./helpers/handlebarsHelpers.js";
import receiptsRouter from "./routes/receipts.js";
import importRouter from "./routes/import.js";
import dataRouter from "./routes/data.js";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 saat
      httpOnly: true,
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
  })
);

// USER'ı tüm template'lere aktarma middleware'i
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use("/", authRouter);
app.use("/", adminRouter);
app.use("/", studentRouter);
app.use("/", paymentsRouter);
app.use("/", settingsRouter);
app.use("/", attendanceRouter);
app.use("/", reportsRouter);
app.use("/", receiptsRouter);
app.use("/", dataRouter);
app.use("/", importRouter);

// ===============================
// BASİT HOME ROUTE (test)
// ===============================
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/admin");
  }

  res.render("pages/home", { title: "Spor Okulu Paneli" });
});

// ===============================
// SUNUCU
// ===============================
export default app;