const jwt = require("jsonwebtoken");

function checkAuth(req, res, next) {
   const token = req.cookies.gndr_cookie;

   if (token) {
      try {
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         res.locals.isAuthenticated = true;
         res.locals.user = decoded;
         req.user = decoded;
      } catch (err) {
         res.locals.isAuthenticated = false;
         res.locals.user = null;
      }
   } else {
      res.locals.isAuthenticated = false;
      res.locals.user = null;
   }

   next();
}

function requireAuth(req, res, next) {
   if (!res.locals.isAuthenticated) {
      return res.redirect("/login");
   }
   next();
}

module.exports = { checkAuth, requireAuth };
