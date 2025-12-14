const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./src/routes');
const cookieParser = require('cookie-parser');
const path = require("path");
const jwt = require("jsonwebtoken");
const { checkAuth, requireAuth } = require("./src/middlewares/auth.middleware");


app.use(cors({
   origin: ["http://127.0.0.1:5500"],
   methods: ["GET", "POST", "PUT", "DELETE"],
   credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

// Dummy data
const accreditationData = {
   national: {
      unggul: 45,
      baikSekali: 113,
      baik: 115,
      tidakTerakreditasi: 12,
      total: 285
   },
   international: {
      aqas: 8,
      abet: 3,
      asiin: 5,
      belumTerakreditasi: 9,
      total: 25
   },
   institutional: {
      banPt: 145,
      lamPtkes: 22,
      lamdik: 18,
      lamemba: 15,
      lamInfokom: 12,
      lainnya: 3,
      total: 215
   },
   projection: {
      2025: 24,
      2026: 18,
      2027: 32,
      2028: 15
   }
};


const universityInfo = {
   name: 'Universitas Sebelas Maret',
   rector: 'Prof. Dr. Ir. Ahmad Yunus, M.S.',
   address: 'Jl. Ir. Sutami No. 36A, Surakarta 57126',
   phone: '+62 271 632450',
   email: 'akreditasi@uns.ac.id',
   website: 'www.uns.ac.id',
   accreditationLevel: 'Unggul',
   certificateNumber: '0234/SK/BAN-PT/Ak-ISK/S/III/2021',
   validUntil: '24 Maret 2026'
};

app.use(checkAuth);

// Home
app.get("/", (req, res) => {
   res.render("index", {
      accreditationData,
      universityInfo,
      title: "Home",
   }, (err, html) => {
      if (err) return res.status(500).send(err.message);

      res.render("layout", {
         body: html,
         title: "Home",
      });
   });
});


app.get("/login", (req, res) => {
   if (res.locals.isAuthenticated) {
      return res.redirect("/");
   }
   renderLogin(res);
});

app.get("/dashboard", requireAuth, (req, res) => {
   res.render("pages/admin/dashboard", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Dashboard",
         activeMenu: "dashboard",
         user: res.locals.user
      });
   });
});


app.get("/accreditations", requireAuth, (req, res) => {
   res.render("pages/admin/accreditations", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Accreditations",
         activeMenu: "accreditations"
      });
   });
});

app.get("/users", requireAuth, (req, res) => {
   if (!["SYSADMIN", "ADMIN"].includes(res.locals.user.roleCode)) {
      return res.status(403).send("Forbidden");
   }
   res.render("pages/admin/users", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Users",
         activeMenu: "users"
      });
   });
});
app.get("/majors", requireAuth, (req, res) => {
   if (!["SYSADMIN", "ADMIN"].includes(res.locals.user.roleCode)) {
      return res.status(403).send("Forbidden");
   }
   res.render("pages/admin/majors", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Majors",
         activeMenu: "majors"
      });
   });
});

app.get("/faculties", requireAuth, (req, res) => {
   if (!["SYSADMIN", "ADMIN"].includes(res.locals.user.roleCode)) {
      return res.status(403).send("Forbidden");
   }
   res.render("pages/admin/faculties", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Faculties",
         activeMenu: "faculties"
      });
   });
});

app.get("/institutions", requireAuth, (req, res) => {
   if (!["SYSADMIN", "ADMIN"].includes(res.locals.user.roleCode)) {
      return res.status(403).send("Forbidden");
   }
   res.render("pages/admin/institutions", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Institutions",
         activeMenu: "institutions"
      });
   });
});

app.get("/notifications", requireAuth, (req, res) => {
   if (!["SYSADMIN", "ADMIN"].includes(res.locals.user.roleCode)) {
      return res.status(403).send("Forbidden");
   }
   res.render("pages/admin/notification", {}, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout-admin", {
         body: html,
         title: "Notifications",
         activeMenu: "notifications"
      });
   });
});

app.get("/reset-password", (req, res) => {
   const { token } = req.query;
   res.render("pages/reset-password", { token }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout", {
         body: html,
         title: "Reset Password"
      });
   });
});

app.get("/akreditasi", (req, res) => {
   const { token } = req.query;
   res.render("pages/accreditation", { token }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render("layout", {
         body: html,
         title: "Akreditasi"
      });
   });
});

function renderLogin(res, errorMessage) {
   res.render("pages/login", { title: "Login", error: errorMessage }, (err, html) => {
      if (err) return res.status(500).send(err.message);

      res.render("layout", {
         body: html,
         title: "Login",
      });
   });
}

app.use('/api', routes);

const port = 3000;
app.listen(port, () => {
   console.log(`Server berjalan di port ${port}`);
});
