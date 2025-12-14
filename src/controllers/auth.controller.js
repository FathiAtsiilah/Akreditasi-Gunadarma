const { User, Log, Role, Major } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
   login: async (req, res) => {
      const { username, password } = req.body;
      try {
         const user = await User.findOne({
            where: { username }, include: [
               {
                  model: Role,
                  as: "role",
                  attributes: ["id", "code", "name"]
               },
               {
                  model: Major,
                  as: "major",
                  attributes: ["id", "code", "name"]
               }
            ]
         });
         if (!user) {
            return res.render("pages/login", {
               title: "Login",
               error: "Username atau password salah",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Login"
               });
            });
         }
         const isMatch = await bcrypt.compare(password, user.password);
         if (!isMatch) {
            return res.render("pages/login", {
               title: "Login",
               error: "Username atau password salah",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Login"
               });
            });
         }
         if (!user.active) {
            return res.render("pages/login", {
               title: "Login",
               error: "Akun Anda tidak aktif, silahkan hubungi administrator",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Login"
               });
            });
         }
         jwt.sign(
            { id: user.id, username: user.username, roleCode: user.role.code, roleName: user.role.name, majorId: user.major.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
            async (err, token) => {
               if (err) {
                  console.error("Error signing JWT:", err);
                  return res.status(500).json({ message: "Internal server error" });
               }
               res.cookie("gndr_cookie", token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  maxAge: 24 * 60 * 60 * 1000,
               });
               await Log.create({
                  user_id: user.id,
                  action: "login",
                  data: { username: user.username },
                  created_on: new Date(),
                  updated_on: new Date(),
                  active: true,
               });
               return res.redirect("/dashboard")
            }
         );
      } catch (error) {
         console.error("Error during login:", error);
         return res.render("pages/login", {
            title: "Login",
            error: "Terjadi kesalahan server",
         }, (err, html) => {
            if (err) return res.status(500).send(err.message);
            res.render("layout", {
               body: html,
               title: "Login"
            });
         });
      }
   },
   logout: async (req, res) => {
      res.clearCookie("gndr_cookie");
      res.redirect("/login");
   },
}
