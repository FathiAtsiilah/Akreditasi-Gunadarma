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

         // Validasi input
         if (!username || !fullname || !email || !role_id || !major_id) {
            return res.status(400).json({
               message: "Semua field harus diisi"
            });
         }

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
               message: "User dengan email atau username ini sudah ada"
            });
         }

         // Generate random password
         const randomPassword = Array(12)
            .fill(null)
            .map(() => Math.random().toString(36).charAt(2))
            .join("");

         const newUser = await User.create({
            username,
            fullname,
            email,
            role_id,
            major_id,
            active: active !== undefined ? active : true,
            password: await bcrypt.hash(randomPassword, 10),
            created_on: new Date(),
            updated_on: new Date()
         });

         // Generate JWT token
         const token = jwt.sign(
            { id: newUser.id, email: newUser.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
         );

         // Kirim email dengan error handling
         try {
            await MailService.sendMail({
               to: email,
               subject: "Akun Berhasil Dibuat - Reset Password",
               template: "reset-password.template",
               context: {
                  username: username,
                  fullname: fullname,
                  logoUrl: "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
                  verificationLink: `${process.env.BASE_URL}/reset-password?token=${token}`,
               },
               platform: "gunadarma",
            });
         } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Tetap lanjutkan meskipun email gagal dikirim
         }

         // Log aktivitas
         if (req.user && req.user.id) {
            await Log.create({
               user_id: req.user.id,
               action: "create-user",
               data: { 
                  admin_username: req.user.username,
                  new_user_email: email 
               },
               created_on: new Date(),
               updated_on: new Date(),
               active: true,
            });
         }

         res.status(201).json({
            message: "User berhasil dibuat",
            user: {
               id: newUser.id,
               username: newUser.username,
               fullname: newUser.fullname,
               email: newUser.email
            }
         });
      } catch (error) {
         console.error("Error during create user:", error);
         res.status(500).json({ 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
         });
      }
   },

   updateUser: async (req, res) => {
      try {
         const { id } = req.params;
         const { username, fullname, email, role_id, major_id, active } = req.body;

         const user = await User.findByPk(id);
         if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
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
               message: "User dengan email atau username ini sudah ada"
            });
         }

         user.username = username;
         user.fullname = fullname;
         user.email = email;
         user.role_id = role_id;
         user.major_id = major_id;
         user.active = active;
         user.updated_on = new Date();

         await user.save();

         if (req.user && req.user.id) {
            await Log.create({
               user_id: req.user.id,
               action: "update-user",
               data: { 
                  admin_username: req.user.username,
                  updated_user_id: id 
               },
               created_on: new Date(),
               updated_on: new Date(),
               active: true,
            });
         }

         res.status(200).json({
            message: "User berhasil diupdate",
            user
         });
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
            return res.status(404).json({ message: "User tidak ditemukan" });
         }

         // Cegah menghapus diri sendiri
         if (req.user && req.user.id === parseInt(id)) {
            return res.status(400).json({ 
               message: "Tidak dapat menghapus akun sendiri" 
            });
         }

         await user.destroy();

         if (req.user && req.user.id) {
            await Log.create({
               user_id: req.user.id,
               action: "delete-user",
               data: { 
                  admin_username: req.user.username,
                  deleted_user: user.username 
               },
               created_on: new Date(),
               updated_on: new Date(),
               active: true,
            });
         }

         res.status(200).json({ message: "User berhasil dihapus" });
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
            return res.status(404).json({ message: "User tidak ditemukan" });
         }

         const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
         );

         try {
            await MailService.sendMail({
               to: user.email,
               subject: "Reset Password - Akun Anda",
               template: "reset-password.template",
               context: {
                  username: user.username,
                  fullname: user.fullname,
                  logoUrl: "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
                  verificationLink: `${process.env.BASE_URL}/reset-password?token=${token}`,
               },
               platform: "gunadarma",
            });

            if (req.user && req.user.id) {
               await Log.create({
                  user_id: req.user.id,
                  action: "send-reset-password-user",
                  data: { 
                     admin_username: req.user.username,
                     target_user: user.username 
                  },
                  created_on: new Date(),
                  updated_on: new Date(),
                  active: true,
               });
            }

            res.status(200).json({ 
               message: "Email reset password berhasil dikirim ke " + user.email 
            });
         } catch (emailError) {
            console.error("Error sending reset password email:", emailError);
            res.status(500).json({ 
               message: "Gagal mengirim email reset password. Silakan coba lagi." 
            });
         }
      } catch (error) {
         console.error("Error sending reset password email:", error);
         res.status(500).json({ 
            message: "Terjadi kesalahan saat mengirim email reset password." 
         });
      }
   },

   resetPassword: async (req, res) => {
      try {
         const { password, token, confirmPassword } = req.body;

         // Validasi input
         if (!token) {
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token: token || '',
               error: "Token tidak valid.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }

         if (!password || !confirmPassword) {
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token,
               error: "Password dan konfirmasi password harus diisi.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }

         // Verifikasi token
         let decodedToken;
         try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
         } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token,
               error: "Token tidak valid atau sudah kadaluarsa.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }

         // Cari user
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

         // Validasi password match
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

         // Validasi panjang password
         if (password.length < 6) {
            return res.render("pages/reset-password", {
               title: "Reset Password",
               token,
               error: "Password minimal 6 karakter.",
            }, (err, html) => {
               if (err) return res.status(500).send(err.message);
               res.render("layout", {
                  body: html,
                  title: "Reset Password"
               });
            });
         }

         // Hash dan simpan password baru
         user.password = await bcrypt.hash(password, 10);
         user.updated_on = new Date();
         await user.save();

         // Log aktivitas
         await Log.create({
            user_id: user.id,
            action: "reset-password",
            data: { username: user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });

         // Redirect ke halaman login dengan pesan sukses
         return res.render("pages/login", {
            title: "Login",
            success: "Password berhasil direset. Silakan login dengan password baru Anda.",
         }, (err, html) => {
            if (err) return res.status(500).send(err.message);
            res.render("layout", {
               body: html,
               title: "Login"
            });
         });

      } catch (error) {
         console.error("Error resetting password:", error);
         
         // Perbaikan: ambil token dari req.body
         const { token } = req.body;
         
         return res.render("pages/reset-password", {
            title: "Reset Password",
            token: token || '',
            error: "Terjadi kesalahan saat reset password. Silakan coba lagi.",
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