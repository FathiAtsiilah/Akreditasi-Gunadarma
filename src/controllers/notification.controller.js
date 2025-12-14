const { Op } = require("sequelize");
const { Notification, Accreditation, User, Institution, Major, Log } = require("../models");
const MailService = require("../services/mail.service");
const cron = require("node-cron");
const moment = require("moment");

const cronJobs = new Map();

module.exports = {
   // Initialize notification system
   initializeNotificationSystem: () => {
      // Check expired accreditations daily at 9 AM
      cron.schedule("0 9 1 * *", async () => {
         console.log("🕛 Mengecek akreditasi yang 6 bulan sebelum habis masa berlaku...");
         await module.exports.checkExpiringAccreditations();
      });
      cron.schedule("0 0 1 * *", async () => {
         console.log("🕛 Mengecek akreditasi yang sudah lewat masa berlaku...");
         await module.exports.deactivateExpiredAccreditations();
      });

      // Load and start all active periodic notifications
      module.exports.loadPeriodicNotifications();
   },

   // Load all periodic notifications
   loadPeriodicNotifications: async () => {
      try {
         const notifications = await Notification.findAll({
            where: {
               active: true,
               type: { [Op.in]: ["daily", "weekly", "monthly", "yearly"] }
            }
         });

         notifications.forEach(notification => {
            module.exports.scheduleNotification(notification);
         });
      } catch (error) {
         console.error("Error loading periodic notifications:", error);
      }
   },

   // Schedule a notification
   scheduleNotification: (notification) => {
      // Stop existing job if exists
      if (cronJobs.has(notification.id)) {
         cronJobs.get(notification.id).stop();
      }

      let cronExpression = "";
      const schedule = notification.data?.schedule || {};

      switch (notification.type) {
         case "daily":
            cronExpression = `${schedule.minute || 0} ${schedule.hour || 9} * * *`;
            break;
         case "weekly":
            cronExpression = `${schedule.minute || 0} ${schedule.hour || 9} * * ${schedule.dayOfWeek || 1}`;
            break;
         case "monthly":
            cronExpression = `${schedule.minute || 0} ${schedule.hour || 9} ${schedule.dayOfMonth || 1} * *`;
            break;
         case "yearly":
            cronExpression = `${schedule.minute || 0} ${schedule.hour || 9} ${schedule.dayOfMonth || 1} ${schedule.month || 1} *`;
            break;
         default:
            return;
      }

      if (cronExpression) {
         const job = cron.schedule(cronExpression, async () => {
            await module.exports.executeNotification(notification);
         });
         cronJobs.set(notification.id, job);
      }
   },

   // Execute notification
   executeNotification: async (notification) => {
      try {
         // Send email to users with role_id 1, 2, 3
         const users = await User.findAll({
            where: {
               role_id: { [Op.in]: [1, 2, 3] },
               active: true
            }
         });

         for (const user of users) {
            if (user.email) {
               await MailService.sendMail({
                  to: user.email,
                  subject: notification.title,
                  template: "notification.template",
                  context: {
                     username: user.username,
                     title: notification.title,
                     description: notification.description,
                     logoUrl: "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
                     dashboardLink: process.env.BASE_URL + "/dashboard"
                  },
                  platform: "gunadarma"
               });
            }
         }

         // Log the notification execution
         await Log.create({
            user_id: 1, // System user
            action: "notification-sent",
            data: { notification_id: notification.id, title: notification.title },
            created_on: new Date(),
            updated_on: new Date(),
            active: true
         });
      } catch (error) {
         console.error("Error executing notification:", error);
      }
   },

   deactivateExpiredAccreditations: async () => {
      try {
         const today = moment().startOf("day").toDate();

         // Cari semua akreditasi yang sudah expired dan masih aktif
         const expiredAccreditations = await Accreditation.findAll({
            where: {
               expired_on: { [Op.lt]: today },
               active: true,
            },
         });

         if (expiredAccreditations.length === 0) {
            console.log("✅ Tidak ada akreditasi yang perlu dinonaktifkan hari ini.");
            return;
         }

         // Update semua akreditasi yang expired jadi nonaktif
         await Accreditation.update(
            { active: false, updated_on: new Date() },
            {
               where: {
                  expired_on: { [Op.lt]: today },
                  active: true,
               },
            }
         );

         console.log(
            `⚠️ ${expiredAccreditations.length} akreditasi telah dinonaktifkan karena sudah melewati masa berlaku.`
         );
      } catch (error) {
         console.error("❌ Error menonaktifkan akreditasi yang sudah expired:", error);
      }
   },

   // Check for expiring accreditations
   checkExpiringAccreditations: async () => {
      try {
         const today = new Date();
         const sixMonthsFromNow = moment().add(6, "months").toDate();

         // Cari semua akreditasi yang akan berakhir dalam 6 bulan ke depan
         const expiringAccreditations = await Accreditation.findAll({
            where: {
               expired_on: { [Op.between]: [today, sixMonthsFromNow] },
               active: true,
            },
            include: [
               { model: Institution, as: "institution" },
               { model: Major, as: "major" },
            ],
         });

         if (expiringAccreditations.length === 0) return;

         // --- Buat data notifikasi ---
         const accreditationList = expiringAccreditations.map((acc) => ({
            code: acc.code,
            name: acc.name,
            expired_on: moment(acc.expired_on).format("DD-MM-YYYY"),
            institution: acc.institution?.name,
            major: acc.major?.name,
            major_id: acc.major?.id,
            daysUntilExpiry: moment(acc.expired_on).diff(moment(), "days"),
         }));

         const notificationData = { accreditations: accreditationList };

         // --- Simpan atau update notifikasi di DB ---
         const [notification, created] = await Notification.findOrCreate({
            where: { type: "expiring-accreditation", active: true },
            defaults: {
               type: "expiring-accreditation",
               title: "Peringatan: Akreditasi Akan Berakhir",
               description: `Terdapat ${expiringAccreditations.length} akreditasi yang akan berakhir dalam 6 bulan ke depan`,
               data: notificationData,
               created_on: new Date(),
               updated_on: new Date(),
               active: true,
            },
         });

         if (!created) {
            notification.description = `Terdapat ${expiringAccreditations.length} akreditasi yang akan berakhir dalam 6 bulan ke depan`;
            notification.data = notificationData;
            notification.updated_on = new Date();
            await notification.save();
         }

         // --- Ambil semua user penerima notifikasi ---
         const adminUsers = await User.findAll({
            where: {
               id: { [Op.in]: [1, 2] }, // user id 1 & 2
               active: true,
            },
         });

         // Ambil semua user yang punya major sesuai dengan akreditasi
         const majorIds = [...new Set(accreditationList.map((a) => a.major_id).filter(Boolean))];
         const majorUsers = await User.findAll({
            where: {
               major_id: { [Op.in]: majorIds },
               active: true,
            },
         });

         // Gabungkan semua user unik berdasarkan email
         const allRecipients = [
            ...adminUsers,
            ...majorUsers.filter(
               (mu) => !adminUsers.some((au) => au.id === mu.id)
            ),
         ];

         // --- Kirim email ---
         for (const user of allRecipients) {
            if (!user.email) continue;

            // Filter akreditasi sesuai major user
            const userAccreditations = accreditationList.filter(
               (a) => a.major_id === user.major_id
            );

            // Jika user adalah admin (id 1 atau 2), kirim semua daftar
            const accreditationsToSend =
               user.id === 1 || user.id === 2 ? accreditationList : userAccreditations;

            if (accreditationsToSend.length === 0) continue;

            await MailService.sendMail({
               to: user.email,
               subject: "Peringatan: Akreditasi Akan Berakhir",
               template: "notification.template",
               context: {
                  username: user.username,
                  count: accreditationsToSend.length,
                  accreditations: accreditationsToSend,
                  logoUrl:
                     "https://media.cakeresume.com/image/upload/s--KlgnT1ky--/c_pad,fl_png8,h_400,w_400/v1630591964/dw7b41vpkqejdyr79t2l.png",
                  dashboardLink: `${process.env.BASE_URL}/dashboard`,
               },
               platform: "gunadarma",
            });
         }

         console.log("✅ Email notifikasi berhasil dikirim ke semua penerima.");
      } catch (error) {
         console.error("❌ Error checking expiring accreditations:", error);
      }
   },

   // CRUD Operations
   getAllNotifications: async (req, res) => {
      try {
         const notifications = await Notification.findAll({
            order: [["created_on", "DESC"]]
         });
         res.status(200).json(notifications);
      } catch (error) {
         console.error("Error fetching notifications:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   getActiveNotifications: async (req, res) => {
      try {
         const notifications = await Notification.findAll({
            where: { active: true },
            order: [["created_on", "DESC"]],
            limit: 10
         });
         res.status(200).json(notifications);
      } catch (error) {
         console.error("Error fetching active notifications:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   getNotificationById: async (req, res) => {
      try {
         const { id } = req.params;
         const notification = await Notification.findByPk(id);

         if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
         }

         res.status(200).json(notification);
      } catch (error) {
         console.error("Error fetching notification:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   createNotification: async (req, res) => {
      try {
         const { type, title, description, image, active, schedule } = req.body;

         const notificationData = {
            type,
            title,
            description,
            image,
            active: active === true || active === "true",
            data: { schedule },
            created_on: new Date(),
            updated_on: new Date()
         };

         const notification = await Notification.create(notificationData);

         // Schedule if it's a periodic notification
         if (["daily", "weekly", "monthly", "yearly"].includes(type) && notification.active) {
            module.exports.scheduleNotification(notification);
         }

         await Log.create({
            user_id: req.user.id,
            action: "create-notification",
            data: { username: req.user.username, notification_id: notification.id },
            created_on: new Date(),
            updated_on: new Date(),
            active: true
         });

         res.status(201).json(notification);
      } catch (error) {
         console.error("Error creating notification:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   updateNotification: async (req, res) => {
      try {
         const { id } = req.params;
         const { type, title, description, image, active, schedule } = req.body;

         const notification = await Notification.findByPk(id);
         if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
         }

         // Stop existing cron job if type or schedule changed
         if (cronJobs.has(notification.id)) {
            cronJobs.get(notification.id).stop();
            cronJobs.delete(notification.id);
         }

         notification.type = type;
         notification.title = title;
         notification.description = description;
         notification.image = image;
         notification.active = active === true || active === "true";
         notification.data = { schedule };
         notification.updated_on = new Date();

         await notification.save();

         // Reschedule if it's a periodic notification
         if (["daily", "weekly", "monthly", "yearly"].includes(type) && notification.active) {
            module.exports.scheduleNotification(notification);
         }

         await Log.create({
            user_id: req.user.id,
            action: "update-notification",
            data: { username: req.user.username, notification_id: notification.id },
            created_on: new Date(),
            updated_on: new Date(),
            active: true
         });

         res.status(200).json(notification);
      } catch (error) {
         console.error("Error updating notification:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   deleteNotification: async (req, res) => {
      try {
         const { id } = req.params;
         const notification = await Notification.findByPk(id);

         if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
         }

         // Stop cron job if exists
         if (cronJobs.has(notification.id)) {
            cronJobs.get(notification.id).stop();
            cronJobs.delete(notification.id);
         }

         await notification.destroy();

         await Log.create({
            user_id: req.user.id,
            action: "delete-notification",
            data: { username: req.user.username, notification_id: id },
            created_on: new Date(),
            updated_on: new Date(),
            active: true
         });

         res.status(204).send();
      } catch (error) {
         console.error("Error deleting notification:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   // Test notification (send immediately)
   testNotification: async (req, res) => {
      try {
         const { id } = req.params;
         const notification = await Notification.findByPk(id);

         if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
         }

         await module.exports.executeNotification(notification);
         res.status(200).json({ message: "Test notification sent successfully" });
      } catch (error) {
         console.error("Error testing notification:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   }
};