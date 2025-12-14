const { Op } = require("sequelize");
const { Institution, Log } = require("../models");

module.exports = {
   getAllInstitutions: async (req, res) => {
      try {
         const institutions = await Institution.findAll({
            attributes: ["id", "code", "name", "type", "active"],
         });
         res.status(200).json(institutions);
      } catch (error) {
         console.error("Error during get all institutions:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   createInstitution: async (req, res) => {
      try {
         const { name, type, active } = req.body;
         const code = name.toUpperCase().replace(/\s+/g, "-");
         const existingInstitution = await Institution.findOne({
            where: {
               code,
            },
         });
         if (existingInstitution) {
            return res.status(400).json({ message: "Kode institusi sudah ada" });
         }
         const newInstitution = await Institution.create({
            code,
            name,
            type,
            active,
            created_on: new Date(),
            updated_on: new Date(),
         });
         await Log.create({
            user_id: req.user.id,
            action: "create-institution",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(201).json(newInstitution);
      } catch (error) {
         console.error("Error during create institution:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   updateInstitution: async (req, res) => {
      try {
         const { id } = req.params;
         const { name, type, active } = req.body;
         const institution = await Institution.findByPk(id);
         if (!institution) {
            return res.status(404).json({ message: "Institution not found" });
         }
         institution.name = name;
         institution.type = type;
         institution.active = active;
         await institution.save();
         await Log.create({
            user_id: req.user.id,
            action: "update-institution",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(200).json(institution);
      } catch (error) {
         console.error("Error during update institution:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   deleteInstitution: async (req, res) => {
      try {
         const { id } = req.params;
         const institution = await Institution.findByPk(id);
         if (!institution) {
            return res.status(404).json({ message: "Institution not found" });
         }
         await institution.destroy();
         await Log.create({
            user_id: req.user.id,
            action: "delete-institution",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(204).send();
      } catch (error) {
         console.error("Error during delete institution:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
}

