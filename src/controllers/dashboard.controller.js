const { Op, where } = require("sequelize");
const { User, Log, Faculty, Major, Accreditation, Institution } = require("../models");

module.exports = {
   getDashboardData: async (req, res) => {
      try {
        let accreditationCount;
        let institutionCount;
        let majorCount;
        const userRole = req.user.roleCode;
        const userMajor = req.user.majorId;
        
         const institutionInternationalCount = await Accreditation.count({
            include: [
               {
                  model: Institution,
                  as: "institution",
                  where: {
                     type: "Internasional",
                     active: true
                  }
               }
            ]
         });
         const institutionNationalCount = await Accreditation.count({
            include: [
               {
                  model: Institution,
                  as: "institution",
                  where: {
                     type: "Nasional",
                     active: true
                  }
               }
            ]
         });


        if (userRole === "STUDY_PROGRAM" && userMajor) {
          institutionCount = await Institution.count({
            include: [
              {
                model: Accreditation,
                as: "accreditations",
                required: true,
                where: { major_id: userMajor },
              },
            ],
          });

          accreditationCount = await Accreditation.count({
            where: { major_id: userMajor },
          });

          majorCount = 0
        } else {
          institutionCount = await Institution.count();
          accreditationCount = await Accreditation.count();
          majorCount = await Major.count({
            where: {
               code: {
                  [Op.ne]: "GENERAL",
               },
            },
         });
        }

         const logs = await Log.findAll({
            order: [["created_on", "DESC"]],
            include: [
               {
                  model: User,
                  as: "user",
                  attributes: ["username"],

               },
            ],
            limit: 5,
         });

         res.status(200).json({
            institutionInternationalCount,
            institutionNationalCount,
            majorCount,
            institutionCount,
            accreditationCount,
            logs
         });
      } catch (error) {
         console.error("Error during get dashboard data:", error);
         res.status(500).json({ message: "Internal server error" });
      }
   },
}

