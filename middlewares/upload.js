import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

export const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (!file.originalname.endsWith(".xlsx"))
      return cb(new Error("Sadece XLSX dosyası kabul edilir."));
    cb(null, true);
  },
});
