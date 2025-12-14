const { Role } = require("../models");

module.exports = {
   getAllRoles: async (req, res) => {
      try {
         const roles = await Role.findAll({
            attributes: ["id", "code", "name"]
         });
         res.status(200).json(roles);
      } catch (error) {
         console.error("Error during get all roles:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   createRole: async (req, res) => {
      try {
         const { code, name } = req.body;
         const newRole = await Role.create({
            code,
            name
         });
         res.status(201).json(newRole);
      } catch (error) {
         console.error("Error during create role:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   }
}

