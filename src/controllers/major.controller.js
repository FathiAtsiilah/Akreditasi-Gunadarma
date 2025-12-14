const { Op } = require("sequelize");
const { Major, Faculty, Log } = require("../models");

module.exports = {
   getAllMajors: async (req, res) => {
      try {
         const majors = await Major.findAll({
            attributes: ["id", "code", "name", "level", "faculty_id", "active"],
            include: [
               {
                  model: Faculty,
                  as: "faculty",
                  attributes: ["id", "code", "name"],
               },
            ],
         });
         res.status(200).json(majors);
      } catch (error) {
         console.error("Error during get all majors:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   createMajor: async (req, res) => {
      try {
         const { code, name, level, faculty_id, active } = req.body;
         const existingMajor = await Major.findOne({
            where: {
               code,
            },
         });
         if (existingMajor) {
            return res.status(400).json({ message: "Kode jurusan sudah ada" });
         }
         const newMajor = await Major.create({
            code,
            name,
            level,
            faculty_id,
            active,
            created_on: new Date(),
            updated_on: new Date(),
         });
         await Log.create({
            user_id: req.user.id,
            action: "create-major",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(201).json(newMajor);
      } catch (error) {
         console.error("Error during create major:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   updateMajor: async (req, res) => {
      try {
         const { id } = req.params;
         const { code, name, level, faculty_id, active } = req.body;
         const major = await Major.findByPk(id);
         if (!major) {
            return res.status(404).json({ message: "Major not found" });
         }
         const existingMajorWithSameCode = await Major.findOne({
            where: {
               code,
               id: {
                  [Op.ne]: id,
               },
            },
         });
         if (existingMajorWithSameCode) {
            return res.status(400).json({ message: "Kode jurusan sudah digunakan" });
         }
         major.code = code;
         major.name = name;
         major.level = level;
         major.faculty_id = faculty_id;
         major.active = active;
         await major.save();
         await Log.create({
            user_id: req.user.id,
            action: "update-major",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(200).json(major);
      } catch (error) {
         console.error("Error during update major:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   deleteMajor: async (req, res) => {
      try {
         const { id } = req.params;
         const major = await Major.findByPk(id);
         if (!major) {
            return res.status(404).json({ message: "Major not found" });
         }
         await major.destroy();
         await Log.create({
            user_id: req.user.id,
            action: "delete-major",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(204).send();
      } catch (error) {
         console.error("Error during delete major:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
}

