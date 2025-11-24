export function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}
