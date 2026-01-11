const { Op } = require("sequelize");
const { Accreditation, Log, Major, Faculty, Institution } = require("../models");
const fs = require("fs");
const path = require("path");
const excelService = require("../services/excel.service");

module.exports = {
   getAllAccreditations: async (req, res) => {
      try {
         const accreditations = await Accreditation.findAll({
            attributes: [
               "id",
               "institution_id",
               "major_id",
               "code",
               "name",
               "rank",
               "year",
               "expired_on",
               "data",
               "active",
            ],
            where: {
               ...(req.query.major_id && { major_id: req.query.major_id }),
            },
         });
         res.status(200).json(accreditations);
      } catch (error) {
         console.error("Error during get all accreditations:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   getMajorsWithoutAccreditation: async (req, res) => {
      try {
         const majors = await Major.findAll({
            attributes: ["id", "name", "level"],
            where: {
               id: {
                  [Op.notIn]: Accreditation.findAll({
                     attributes: ["major_id"],
                  }),
               },
            },
            include: [
               {
                  model: Faculty,
                  as: "faculty",
                  attributes: ["id", "name"]
               },
            ],
         });
         res.status(200).json(majors);
      } catch (error) {
         console.error("Error during get majors without accreditation:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
   createAccreditation: async (req, res) => {
      try {
         const {
            institution_id,
            major_id,
            code,
            name,
            rank,
            year,
            expired_on,
            active,
            documentsData
         } = req.body;

         // Check if code already exists
         const existingAccreditation = await Accreditation.findOne({
            where: { code }
         });

         if (existingAccreditation) {
            // Delete uploaded files if accreditation creation fails
            if (req.files && req.files.length > 0) {
               req.files.forEach(file => {
                  fs.unlinkSync(file.path);
               });
            }
            return res.status(400).json({ message: "Kode akreditasi sudah ada" });
         }

         // Process documents
         let documents = [];
         if (documentsData) {
            try {
               const parsedDocumentsData = JSON.parse(documentsData);
               console.log('Received documents data:', parsedDocumentsData); // Debug

               documents = parsedDocumentsData.map((doc, index) => {
                  // If new file uploaded for this document
                  if (doc.fileIndex !== undefined && req.files[doc.fileIndex]) {
                     const file = req.files[doc.fileIndex];
                     return {
                        name: doc.name,
                        type: doc.type || '',
                        file: `/documents/${file.filename}`
                     };
                  }
                  // Keep existing file path
                  return {
                     name: doc.name,
                     type: doc.type || '',
                     file: doc.file || ''
                  };
               });
            } catch (parseError) {
               console.error("Error parsing documents data:", parseError);
               // Delete uploaded files on error
               if (req.files && req.files.length > 0) {
                  req.files.forEach(file => {
                     fs.unlinkSync(file.path);
                  });
               }
               return res.status(400).json({ message: "Invalid documents data format" });
            }
         }

         // Create accreditation data object
         const data = {
            documents: documents
         };

         const newAccreditation = await Accreditation.create({
            institution_id,
            major_id,
            code,
            name,
            rank: parseInt(rank) || rank,
            year,
            expired_on,
            data: data,
            active: active === 'true' || active === true,
            created_on: new Date(),
            updated_on: new Date(),
         });

         await Log.create({
            user_id: req.user.id,
            action: "create-accreditation",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });

         res.status(201).json(newAccreditation);
      } catch (error) {
         console.error("Error during create accreditation:", error);
         // Delete uploaded files on error
         if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
               try {
                  fs.unlinkSync(file.path);
               } catch (unlinkError) {
                  console.error("Error deleting file:", unlinkError);
               }
            });
         }
         res.status(500).json({ message: "Internal server error" });
      }
   },

   updateAccreditation: async (req, res) => {
      try {
         const { id } = req.params;
         const {
            institution_id,
            major_id,
            code,
            name,
            rank,
            year,
            expired_on,
            active,
            documentsData
         } = req.body;

         // Find existing accreditation
         const accreditation = await Accreditation.findByPk(id);
         if (!accreditation) {
            // Delete uploaded files if accreditation not found
            if (req.files && req.files.length > 0) {
               req.files.forEach(file => {
                  fs.unlinkSync(file.path);
               });
            }
            return res.status(404).json({ message: "Accreditation not found" });
         }

         // Check if code already exists (excluding current record)
         const existingAccreditationWithSameCode = await Accreditation.findOne({
            where: {
               code,
               id: { [Op.ne]: id }
            }
         });

         if (existingAccreditationWithSameCode) {
            // Delete uploaded files if code conflict
            if (req.files && req.files.length > 0) {
               req.files.forEach(file => {
                  fs.unlinkSync(file.path);
               });
            }
            return res.status(400).json({ message: "Kode akreditasi sudah digunakan" });
         }

         // Process documents
         let documents = [];
         const oldDocuments = accreditation.data?.documents || [];

         if (documentsData) {
            try {
               const parsedDocumentsData = JSON.parse(documentsData);
               console.log('Received documents data (update):', parsedDocumentsData); // Debug

               documents = parsedDocumentsData.map((doc, index) => {
                  // If new file uploaded for this document
                  if (doc.fileIndex !== undefined && req.files[doc.fileIndex]) {
                     const file = req.files[doc.fileIndex];

                     // Delete old file if it exists and is different
                     const oldDoc = oldDocuments.find(oldD => oldD.name === doc.name);
                     if (oldDoc && oldDoc.file && oldDoc.file !== doc.file) {
                        const oldFilePath = path.join('public', oldDoc.file);
                        if (fs.existsSync(oldFilePath)) {
                           fs.unlinkSync(oldFilePath);
                        }
                     }

                     return {
                        name: doc.name,
                        type: doc.type || '',
                        file: `/documents/${file.filename}`
                     };
                  }
                  // Keep existing file path
                  return {
                     name: doc.name,
                     type: doc.type || '',
                     file: doc.file || ''
                  };
               });

               // Delete old files that are no longer used
               oldDocuments.forEach(oldDoc => {
                  const stillUsed = documents.some(newDoc => newDoc.file === oldDoc.file);
                  if (!stillUsed && oldDoc.file) {
                     const oldFilePath = path.join('public', oldDoc.file);
                     if (fs.existsSync(oldFilePath)) {
                        try {
                           fs.unlinkSync(oldFilePath);
                        } catch (error) {
                           console.error("Error deleting old file:", error);
                        }
                     }
                  }
               });

            } catch (parseError) {
               console.error("Error parsing documents data:", parseError);
               // Delete uploaded files on error
               if (req.files && req.files.length > 0) {
                  req.files.forEach(file => {
                     fs.unlinkSync(file.path);
                  });
               }
               return res.status(400).json({ message: "Invalid documents data format" });
            }
         } else {
            // Keep existing documents if no new documents data provided
            documents = oldDocuments;
         }

         // Update accreditation data
         const data = {
            documents: documents
         };

         accreditation.institution_id = institution_id;
         accreditation.major_id = major_id;
         accreditation.code = code;
         accreditation.name = name;
         accreditation.rank = parseInt(rank) || rank;
         accreditation.year = year;
         accreditation.expired_on = expired_on;
         accreditation.data = data;
         accreditation.active = active === 'true' || active === true;
         accreditation.updated_on = new Date();

         await accreditation.save();
         await Log.create({
            user_id: req.user.id,
            action: "update-accreditation",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(200).json(accreditation);
      } catch (error) {
         console.error("Error during update accreditation:", error);
         // Delete uploaded files on error
         if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
               try {
                  fs.unlinkSync(file.path);
               } catch (unlinkError) {
                  console.error("Error deleting file:", unlinkError);
               }
            });
         }
         res.status(500).json({ message: "Internal server error" });
      }
   },

   deleteAccreditation: async (req, res) => {
      try {
         const { id } = req.params;
         const accreditation = await Accreditation.findByPk(id);

         if (!accreditation) {
            return res.status(404).json({ message: "Accreditation not found" });
         }

         // Delete associated files
         if (accreditation.data?.documents) {
            accreditation.data.documents.forEach(doc => {
               if (doc.file) {
                  const filePath = path.join('public', doc.file);
                  if (fs.existsSync(filePath)) {
                     try {
                        fs.unlinkSync(filePath);
                     } catch (error) {
                        console.error("Error deleting file:", error);
                     }
                  }
               }
            });
         }

         await accreditation.destroy();
         await Log.create({
            user_id: req.user.id,
            action: "delete-accreditation",
            data: { username: req.user.username },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });
         res.status(204).send();
      } catch (error) {
         console.error("Error during delete accreditation:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },

   exportAccreditationsToExcel: async (req, res) => {
      try {
         // Fetch all accreditations with related data
         const accreditations = await Accreditation.findAll({
            attributes: [
               "id",
               "code",
               "name",
               "rank",
               "year",
               "expired_on",
               "active",
            ],
            include: [
               {
                  model: Major,
                  as: "major",
                  attributes: ["id", "name", "level"],
                  include: [
                     {
                        model: Faculty,
                        as: "faculty",
                        attributes: ["id", "name"],
                     },
                  ],
               },
               {
                  model: Institution,
                  as: "institution",
                  attributes: ["id", "name", "type"],
               },
            ],
            order: [["id", "ASC"]],
         });

         // Generate Excel workbook
         const workbook = await excelService.exportAccreditationsToExcel(accreditations);

         // Set response headers
         const fileName = `Data_Akreditasi_${new Date().toISOString().split('T')[0]}.xlsx`;
         res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
         );
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

         // Write workbook to response
         await workbook.xlsx.write(res);

         // Log the export action
         await Log.create({
            user_id: req.user.id,
            action: "export-accreditations",
            data: { username: req.user.username, fileName },
            created_on: new Date(),
            updated_on: new Date(),
            active: true,
         });

         res.end();
      } catch (error) {
         console.error("Error exporting accreditations to Excel:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
}