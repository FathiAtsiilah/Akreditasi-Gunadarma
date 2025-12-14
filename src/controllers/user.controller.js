const { Op } = require("sequelize");
const { User, Role, Major, Log } = require("../models");
const bcrypt = require("bcrypt");
const MailService = require("../services/mail.service");
const jwt = require("jsonwebtoken");

module.exports = {
   getAllUsers: async (req, res) => {
      try {
         const users = await User.findAll({
            attributes: ["id", "username", "fullname", "email", "active"],
            include: [
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
         res.status(200).json(users);
      } catch (error) {
         console.error("Error during get all users:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   createUser: async (req, res) => {
      try {
         const { username, fullname, email, role_id, major_id, active } = req.body;
         const existingUser = await User.findOne({
            where: {
               [Op.or]: [
                  { email },
                  { username }
               ]
            }
         });
         if (existingUser) {
            return res.status(400).json({
               message: "User with this email or username already exists"
            });
         }
         const newUser = await User.create({
            username,
            fullname,
            email,
            role_id,
            major_id,
            active,
            password: await bcrypt.hash(
               Array(10)
                  .fill(null)
                  .map(() => (Math.random() * 36).toString(36)[Math.floor(Math.random() * 36)])
                  .join(""),
               10
            ),
            created_on: new Date(),
            updated_on: new Date()
         });
         const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
         await MailService.sendMail({
            to: email,
            subject: "Account Reset Password",
            template: "reset-password.template",
            context: {
               username: username,
               logoUrl: "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
               verificationLink: process.env.BASE_URL + "/reset-password?token=" + token,
            },
            platform: "gunadarma",
         });
         await Log.create({
            user_id: req.user.id,
            action: "create-user",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(201).json(newUser);
      } catch (error) {
         console.error("Error during create user:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   updateUser: async (req, res) => {
      try {
         const { id } = req.params;
         const { username, fullname, email, role_id, major_id, active } = req.body;

         const user = await User.findByPk(id);
         if (!user) {
            return res.status(404).json({ message: "User not found" });
         }

         const existingUser = await User.findOne({
            where: {
               [Op.and]: [
                  { id: { [Op.ne]: id } },
                  {
                     [Op.or]: [
                        { username },
                        { email }
                     ]
                  }
               ]
            }
         });
         if (existingUser) {
            return res.status(400).json({
               message: "User with this email or username already exists"
            });
         }

         user.username = username;
         user.fullname = fullname;
         user.email = email;
         user.role_id = role_id;
         user.major_id = major_id;
         user.active = active;

         await user.save();
         await Log.create({
            user_id: req.user.id,
            action: "update-user",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(200).json(user);
      } catch (error) {
         console.error("Error during update user:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   deleteUser: async (req, res) => {
      try {
         const { id } = req.params;
         const user = await User.findByPk(id);
         if (!user) {
            return res.status(404).json({ message: "User not found" });
         }
         await user.destroy();
         await Log.create({
            user_id: req.user.id,
            action: "delete-user",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(204).send();
      } catch (error) {
         console.error("Error during delete user:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   sendResetPasswordUser: async (req, res) => {
      try {
         const { id } = req.params;
         const user = await User.findByPk(id);
         if (!user) {
            return res.status(404).json({ message: "User not found" });
         }
         const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
         await MailService.sendMail({
            to: user.email,
            subject: "Account Reset Password",
            template: "reset-password.template",
            context: {
               username: user.username,
               logoUrl: "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
               verificationLink: process.env.BASE_URL + "/reset-password?token=" + token,
            },
            platform: "gunadarma",
         });
         await Log.create({
            user_id: req.user.id,
            action: "send-reset-password-user",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(200).json({ message: "Email reset password berhasil dikirim." });
      } catch (error) {
         console.error("Error sending reset password email:", error);
         res.status(500).json({ message: "Terjadi kesalahan saat mengirim email reset password." });
      }
   },
   resetPassword: async (req, res) => {
      try {
         const { password, token, confirmPassword } = req.body;
         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
         const user = await User.findByPk(decodedToken.id);
         if (!user) {
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token,
               error: "User tidak ditemukan.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }

         if (password !== confirmPassword) {
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token,
               error: "Password dan konfirmasi password tidak cocok.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }
         user.password = await bcrypt.hash(password, 10);
         await user.save();
         return res.render("pages/login", {
            title: "Login",
            success: "Password berhasil direset.",
         }, (err, html) => {
            if (err) return res.status(500).send(err.message);
            res.render("layout", {
               body: html,
               title: "Login"
            });
         });
      } catch (error) {
         console.error("Error resetting password:", error);
         return res.render("pages/reset-password", {
            title: "Reset Password",
            token,
            error: "Terjadi kesalahan saat reset password.",
         }, (err, html) => {
            if (err) return res.status(500).send(err.message);
            res.render("layout", {
               body: html,
               title: "Reset Password"
            });
         });
      }
   }
};
