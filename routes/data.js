import express from "express";
import { requireAdmin } from "../middlewares/auth.js";

const dataRouter = express.Router();

dataRouter.get("/admin/data", requireAdmin, async (req, res) => {
  res.render("pages/data/index", {
    title: "Veri Yönetimi",
    year: new Date().getFullYear(),
    active: "data"
  });
});

export default dataRouter;
