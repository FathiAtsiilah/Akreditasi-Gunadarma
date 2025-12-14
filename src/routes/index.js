const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const { login, logout } = require("../controllers/auth.controller");
const { getDashboardData } = require("../controllers/dashboard.controller");
const { getAllUsers, createUser, updateUser, deleteUser, sendResetPasswordUser, resetPassword } = require("../controllers/user.controller");
const { getAllRoles } = require("../controllers/role.controller");
const { getAllMajors, createMajor, updateMajor, deleteMajor } = require("../controllers/major.controller");
const { getAllFaculties, createFaculty, updateFaculty, deleteFaculty } = require("../controllers/faculty.controller");
const { getAllInstitutions, createInstitution, updateInstitution, deleteInstitution } = require("../controllers/institution.controller");
const { getAllAccreditations, getMajorsWithoutAccreditation, createAccreditation, updateAccreditation, deleteAccreditation } = require("../controllers/accreditation.controller");
const { getAccreditationStats, getChartData, getAkreditasiData } = require("../controllers/home.controller");
const { initializeNotificationSystem, getAllNotifications, createNotification, updateNotification, deleteNotification, getActiveNotifications, getNotificationById, testNotification } = require("../controllers/notification.controller");

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      const uploadDir = 'public/documents';
      if (!fs.existsSync(uploadDir)) {
         fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
   },
   filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
   }
});

const fileFilter = (req, file, cb) => {
   const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimetype = allowedTypes.test(file.mimetype);

   if (mimetype && extname) {
      return cb(null, true);
   } else {
      cb(new Error('File type not allowed. Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed.'));
   }
};

const upload = multer({
   storage: storage,
   limits: {
      fileSize: 10 * 1024 * 1024,
   },
   fileFilter: fileFilter
});

router.post("/login", login);
router.get("/logout", logout);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-password", sendResetPasswordUser);
router.post("/reset-password", resetPassword);

router.get("/majors", getAllMajors);
router.post("/majors", createMajor);
router.put("/majors/:id", updateMajor);
router.delete("/majors/:id", deleteMajor);

router.get("/faculties", getAllFaculties);
router.post("/faculties", createFaculty);
router.put("/faculties/:id", updateFaculty);
router.delete("/faculties/:id", deleteFaculty);

router.get("/institutions", getAllInstitutions);
router.post("/institutions", createInstitution);
router.put("/institutions/:id", updateInstitution);
router.delete("/institutions/:id", deleteInstitution);

router.get("/accreditations", getAllAccreditations);
router.get("/accreditations/majors", getMajorsWithoutAccreditation);
router.post("/accreditations", upload.array('documents'), createAccreditation);
router.put("/accreditations/:id", upload.array('documents'), updateAccreditation);
router.delete("/accreditations/:id", deleteAccreditation);

router.get("/accreditations/stats", getAccreditationStats);
router.get("/chart-data", getChartData);
router.get("/akreditasi-data", getAkreditasiData);

router.get("/dashboard", getDashboardData);
router.get("/roles", getAllRoles);

router.get("/notifications/active",
   getActiveNotifications
);
router.get("/notifications",
   getAllNotifications
);
router.get("/notifications/:id",
   getNotificationById
);
router.post("/notifications",
   createNotification
)
router.put("/notifications/:id",
   updateNotification
);
router.delete("/notifications/:id",
   deleteNotification
);
router.post("/notifications/:id/test",
   testNotification
);

initializeNotificationSystem();

module.exports = router;