import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const authRouter = express.Router();

// LOGIN SAYFASI
authRouter.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/admin");
  res.render("pages/login", { title: "Giriş Yap" });
});

// LOGIN POST
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.render("pages/login", {
      title: "Giriş Yap",
      error: "Kullanıcı bulunamadı"
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("pages/login", {
      title: "Giriş Yap",
      error: "Şifre yanlış"
    });
  }

  // SESSION
  req.session.user = {
    id: user._id,
    username: user.username,
    role: user.role
  };

  res.redirect("/admin");
});

// LOGOUT
authRouter.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default authRouter;
