const { Accreditation, Major, Institution, Faculty } = require("../models");
const { Op, Sequelize } = require("sequelize");

module.exports = {
   getAccreditationStats: async (req, res) => {
      try {
         const stats = await Accreditation.findAll({
            attributes: [
               'rank',
               [Sequelize.fn('COUNT', Sequelize.col('rank')), 'count']
            ],
            where: {
               active: true
            },
            group: ['rank'],
            raw: true
         });

         const totalAccreditations = await Accreditation.count({
            where: { active: true }
         });

         const accreditationStats = {
            "A": 0,
            "Baik Sekali": 0,
            "Baik": 0,
            "Dalam Perbaikan": await Major.count({
               where: {
                  id: {
                     [Op.notIn]: Sequelize.literal(`(SELECT major_id FROM accreditations WHERE active = true)`)
                  }
               }
            })
         };

         stats.forEach(stat => {
            switch (stat.rank) {
               case "A": accreditationStats["A"] = parseInt(stat.count); break;
               case "Baik Sekali": accreditationStats["Baik Sekali"] = parseInt(stat.count); break;
               case "Baik": accreditationStats["Baik"] = parseInt(stat.count); break;
               case "Dalam Perbaikan": accreditationStats["Dalam Perbaikan"] = parseInt(stat.count); break;
            }
         });

         res.json({
            success: true,
            data: { accreditationStats, totalAccreditations }
         });

      } catch (error) {
         console.error("Error fetching accreditation stats:", error);
         res.status(500).json({
            success: false,
            message: "Internal server error"
         });
      }
   },
   getChartData: async (req, res) => {
      try {
         const { type } = req.query;

         if (type === 'yearly') {
            const yearlyDataNational = await Accreditation.findAll({
               attributes: [
                  'year',
                  'rank',
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count'],
                  [Sequelize.col('institution.type'), 'institutionType'],
                  [Sequelize.col('institution.name'), 'institutionName']
               ],
               include: [{
                  model: Institution,
                  as: 'institution',
                  attributes: [],
                  where: { type: 'Nasional' }
               }],
               where: {
                  active: true,
                  year: {
                     [Op.not]: null,
                     [Op.gte]: new Date(new Date().getFullYear() - 5, 0, 1)
                  }
               },
               group: ['year', 'rank', 'institution.type', 'institution.name'],
               order: [['year', 'ASC']],
               raw: true
            });

            const yearlyDataInternational = await Accreditation.findAll({
               attributes: [
                  'year',
                  'rank',
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count'],
                  [Sequelize.col('institution.name'), 'institutionName']
               ],
               include: [{
                  model: Institution,
                  as: 'institution',
                  attributes: [],
                  where: { type: 'Internasional' }
               }],
               where: {
                  active: true,
                  year: {
                     [Op.not]: null,
                     [Op.gte]: new Date(new Date().getFullYear() - 5, 0, 1)
                  }
               },
               group: ['year', 'rank', 'institution.name'],
               order: [['year', 'ASC']],
               raw: true
            });

            const yearlyDataInstitutionNational = await Accreditation.findAll({
               attributes: [
                  'year',
                  'rank',
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count'],
                  [Sequelize.col('institution.name'), 'institutionName']
               ],
               include: [{
                  model: Institution,
                  as: 'institution',
                  attributes: [],
                  where: { type: 'Nasional' }
               }],
               where: {
                  active: true,
                  year: {
                     [Op.not]: null,
                      [Op.gte]: new Date(new Date().getFullYear() - 5, 0, 1)
                  }
               },
               group: ['year', 'rank', 'institution.name'],
               order: [['year', 'ASC']],
               raw: true
            });

            const currentYear = new Date().getFullYear();
            const yearlyDataExpiring = await Accreditation.findAll({
               attributes: [
                  [Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'year'],
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count']
               ],
               where: {
                  expired_on: {
                     [Op.gte]: new Date(`${currentYear}-01-01`),
                     [Op.lte]: new Date(`${currentYear + 4}-12-31`)
                  }
               },
               group: [Sequelize.fn('YEAR', Sequelize.col('expired_on'))],
               order: [[Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'ASC']],
               raw: true
            });
            const yearlyDataExpiringFormatted = {};
            for (let year = currentYear; year <= currentYear + 3; year++) {
               yearlyDataExpiringFormatted[year] = 0;
            }
            yearlyDataExpiring.forEach(item => {
               const year = item.year;
               const count = parseInt(item.count, 10);
               if (yearlyDataExpiringFormatted.hasOwnProperty(year)) {
                  yearlyDataExpiringFormatted[year] = count;
               }
            });

            const facultyDataExpiring = await Accreditation.findAll({
               attributes: [
                  [Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'year'],
                  [Sequelize.col('major.faculty.name'), 'facultyName'],
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count']
               ],
               include: [{
                  model: Major,
                  as: 'major',
                  attributes: [],
                  include: [{
                     model: Faculty,
                     as: 'faculty',
                     attributes: []
                  }]
               }],
               where: {
                  active: true,
                  expired_on: {
                     [Op.gte]: new Date(`${currentYear}-01-01`),
                     [Op.lte]: new Date(`${currentYear + 3}-12-31`)
                  }
               },
               group: [
                  Sequelize.fn('YEAR', Sequelize.col('expired_on')),
                  'major.faculty.name'
               ],
               order: [
                  [Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'ASC'],
                  [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'DESC']
               ],
               raw: true
            });

            const facultyDataByYear = {};
            for (let year = currentYear; year <= currentYear + 3; year++) {
               facultyDataByYear[year] = [];
            }

            facultyDataExpiring.forEach(item => {
               const year = item.year;
               const facultyName = item.facultyName;
               const count = parseInt(item.count, 10);

               if (facultyDataByYear[year]) {
                  facultyDataByYear[year].push({
                     facultyName,
                     count
                  });
               }
            });

            Object.keys(facultyDataByYear).forEach(year => {
               facultyDataByYear[year] = facultyDataByYear[year]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3);
            });

            res.json({
               success: true,
               data: {
                  nasional: formatYearlyData(yearlyDataNational),
                  internasional: formatYearlyData(yearlyDataInternational),
                  nasionalInstitution: formatYearlyData(yearlyDataInstitutionNational),
                  projectionExpiring: yearlyDataExpiringFormatted,
                  facultyProjection: facultyDataByYear
               }
            });
         } else {
            res.status(400).json({
               success: false,
               message: "Invalid chart type"
            });
         }

      } catch (error) {
         console.error("Error fetching chart data:", error);
         res.status(500).json({
            success: false,
            message: "Internal server error"
         });
      }
   },
   getAkreditasiData: async (req, res) => {
      try {
         const { type, page = 1, limit = 10, fakultas, level, institution_type, rank } = req.query;
         const currentDate = new Date();
         const currentYear = currentDate.getFullYear();

         switch (type) {
            case 'reakreditasi_belum':
               // Program Studi yang akan Reakreditasi dan Belum Akreditasi
               const reakreditasiBelum = await Accreditation.findAll({
                  attributes: [
                     'id', 'rank', 'expired_on', 'active'
                  ],
                  include: [
                     {
                        model: Major,
                        as: 'major',
                        attributes: ['id', 'name', 'level'],
                        include: [{
                           model: Faculty,
                           as: 'faculty',
                           attributes: ['name']
                        }]
                     },
                     {
                        model: Institution,
                        as: 'institution',
                        attributes: ['name', 'type']
                     }
                  ],
                  where: {
                     [Op.or]: [
                        {
                           // Akreditasi akan berakhir dalam 6 bulan
                           expired_on: {
                              [Op.between]: [currentDate, new Date(currentDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)]
                           },
                           active: true
                        },
                        {
                           // Program studi belum memiliki akreditasi aktif
                           active: false
                        }
                     ]
                  },
                  order: [['expired_on', 'ASC']],
                  limit: 50
               });

               return res.json({
                  success: true,
                  data: reakreditasiBelum
               });

            case 'reakreditasi_nasional':
               // Program Studi yang akan Reakreditasi Akreditasi Nasional
               const reakreditasiNasional = await Accreditation.findAll({
                  attributes: [
                     'id', 'rank', 'expired_on', 'year', 'active'
                  ],
                  include: [
                     {
                        model: Major,
                        as: 'major',
                        attributes: ['id', 'name', 'level'],
                        include: [{
                           model: Faculty,
                           as: 'faculty',
                           attributes: ['name']
                        }]
                     },
                     {
                        model: Institution,
                        as: 'institution',
                        attributes: ['name'],
                        where: { type: 'Nasional' }
                     }
                  ],
                  where: {
                     expired_on: {
                        [Op.between]: [currentDate, new Date(currentDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000)]
                     },
                     active: true
                  },
                  order: [['expired_on', 'ASC']],
                  limit: 100
               });

               return res.json({
                  success: true,
                  data: reakreditasiNasional
               });

            case 'reakreditasi_internasional':
               // Program Studi yang akan Reakreditasi Akreditasi Internasional
               const reakreditasiInternasional = await Accreditation.findAll({
                  attributes: [
                     'id', 'rank', 'expired_on', 'year', 'active'
                  ],
                  include: [
                     {
                        model: Major,
                        as: 'major',
                        attributes: ['id', 'name', 'level'],
                        include: [{
                           model: Faculty,
                           as: 'faculty',
                           attributes: ['name']
                        }]
                     },
                     {
                        model: Institution,
                        as: 'institution',
                        attributes: ['name'],
                        where: { type: 'Internasional' }
                     }
                  ],
                  where: {
                     expired_on: {
                        [Op.between]: [currentDate, new Date(currentDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000)]
                     },
                     active: true
                  },
                  order: [['expired_on', 'ASC']],
                  limit: 100
               });

               return res.json({
                  success: true,
                  data: reakreditasiInternasional
               });

            case 'filtered_data':
               // New filtered table with pagination
               const offset = (parseInt(page) - 1) * parseInt(limit);

               // Build where conditions
               let whereConditions = {
                  active: true
               };

               let includeConditions = [
                  {
                     model: Major,
                     as: 'major',
                     attributes: ['id', 'name', 'level'],
                     include: [{
                        model: Faculty,
                        as: 'faculty',
                        attributes: ['id', 'name']
                     }],
                     where: {}
                  },
                  {
                     model: Institution,
                     as: 'institution',
                     attributes: ['name', 'type'],
                     where: {}
                  }
               ];

               // Apply filters
               if (fakultas && fakultas !== 'all') {
                  includeConditions[0].include[0].where.id = fakultas;
               }

               if (level && level !== 'all') {
                  includeConditions[0].where.level = level;
               }

               if (institution_type && institution_type !== 'all') {
                  includeConditions[1].where.type = institution_type;
               }

               if (rank && rank !== 'all') {
                  whereConditions.rank = rank;
               }

               // Clean up empty where conditions
               if (includeConditions[0].where && Object.keys(includeConditions[0].where).length === 0) {
                  delete includeConditions[0].where;
               }
               if (includeConditions[0].include[0].where && Object.keys(includeConditions[0].include[0].where).length === 0) {
                  delete includeConditions[0].include[0].where;
               }
               if (includeConditions[1].where && Object.keys(includeConditions[1].where).length === 0) {
                  delete includeConditions[1].where;
               }

               const { count, rows } = await Accreditation.findAndCountAll({
                  attributes: [
                     'id', 'rank', 'expired_on', 'year', 'active', 'data'
                  ],
                  include: includeConditions,
                  where: whereConditions,
                  order: [['expired_on', 'DESC']],
                  limit: parseInt(limit),
                  offset: offset,
                  distinct: true
               });

               return res.json({
                  success: true,
                  data: {
                     items: rows,
                     pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(count / parseInt(limit)),
                        totalItems: count,
                        itemsPerPage: parseInt(limit)
                     }
                  }
               });

            case 'filter_options':
               // Get filter options
               const [faculties, levels, institutionTypes, ranks] = await Promise.all([
                  // Get all faculties
                  Faculty.findAll({
                     attributes: ['id', 'name'],
                     order: [['name', 'ASC']]
                  }),
                  // Get unique levels
                  Major.findAll({
                     attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('level')), 'level']],
                     order: [['level', 'ASC']],
                     raw: true
                  }),
                  // Get unique institution types
                  Institution.findAll({
                     attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type']],
                     order: [['type', 'ASC']],
                     raw: true
                  }),
                  // Get unique ranks
                  Accreditation.findAll({
                     attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('rank')), 'rank']],
                     where: {
                        rank: { [Op.ne]: null }
                     },
                     order: [['rank', 'ASC']],
                     raw: true
                  })
               ]);

               return res.json({
                  success: true,
                  data: {
                     faculties: faculties,
                     levels: levels.map(l => l.level),
                     institutionTypes: institutionTypes.map(t => t.type),
                     ranks: ranks.map(r => r.rank)
                  }
               });

            case 'berakhir_per_tahun':
               // Akreditasi Nasional Berakhir per Tahun (4 tahun ke depan)
               const berakhirPerTahun = await Accreditation.findAll({
                  attributes: [
                     [Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'year'],
                     'rank',
                     [Sequelize.fn('COUNT', Sequelize.col('Accreditation.id')), 'count']
                  ],
                  include: [{
                     model: Institution,
                     as: 'institution',
                     attributes: [],
                     where: { type: 'Nasional' }
                  }],
                  where: {
                     expired_on: {
                        [Op.gte]: new Date(`${currentYear}-01-01`),
                        [Op.lte]: new Date(`${currentYear + 3}-12-31`)
                     },
                     active: true
                  },
                  group: [
                     Sequelize.fn('YEAR', Sequelize.col('expired_on')),
                     'rank'
                  ],
                  order: [
                     [Sequelize.fn('YEAR', Sequelize.col('expired_on')), 'ASC'],
                     ['rank', 'ASC']
                  ],
                  raw: true
               });

               // Format data per tahun dan rank
               const formattedYearlyData = {};
               for (let year = currentYear; year <= currentYear + 3; year++) {
                  formattedYearlyData[year] = {
                     'Unggul': 0,
                     'Baik Sekali': 0,
                     'Baik': 0,
                     'Total': 0
                  };
               }

               berakhirPerTahun.forEach(item => {
                  const year = item.year;
                  const rank = item.rank || 'Baik';
                  const count = parseInt(item.count, 10);

                  if (formattedYearlyData[year]) {
                     formattedYearlyData[year][rank] = count;
                     formattedYearlyData[year]['Total'] += count;
                  }
               });

               return res.json({
                  success: true,
                  data: formattedYearlyData
               });

            case 'detail_per_fakultas':
               // Detail per Fakultas
               const detailPerFakultas = await Accreditation.findAll({
                  attributes: [
                     'id', 'rank', 'expired_on', 'year'
                  ],
                  include: [
                     {
                        model: Major,
                        as: 'major',
                        attributes: ['id', 'name', 'level'],
                        include: [{
                           model: Faculty,
                           as: 'faculty',
                           attributes: ['id', 'name']
                        }]
                     },
                     {
                        model: Institution,
                        as: 'institution',
                        attributes: ['name', 'type']
                     }
                  ],
                  where: {
                     active: true,
                     expired_on: {
                        [Op.gte]: currentDate
                     }
                  },
                  order: [
                     [{ model: Major, as: 'major' }, { model: Faculty, as: 'faculty' }, 'name', 'ASC'],
                     ['expired_on', 'ASC']
                  ]
               });

               // Group by faculty
               const groupedByFaculty = {};
               detailPerFakultas.forEach(item => {
                  const facultyName = item.major.faculty.name;
                  if (!groupedByFaculty[facultyName]) {
                     groupedByFaculty[facultyName] = {
                        facultyId: item.major.faculty.id,
                        facultyName: facultyName,
                        programs: [],
                        summary: {
                           total: 0,
                           'Unggul': 0,
                           'Baik Sekali': 0,
                           'Baik': 0,
                           expiringSoon: 0 // berakhir dalam 6 bulan
                        }
                     };
                  }

                  const faculty = groupedByFaculty[facultyName];
                  faculty.programs.push(item);
                  faculty.summary.total++;
                  faculty.summary[item.rank || 'Baik']++;

                  // Check if expiring soon (within 6 months)
                  const sixMonthsFromNow = new Date(currentDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
                  if (new Date(item.expired_on) <= sixMonthsFromNow) {
                     faculty.summary.expiringSoon++;
                  }
               });

               return res.json({
                  success: true,
                  data: Object.values(groupedByFaculty)
               });

            case 'statistik_umum':
               // Statistik Umum
               const statistikUmum = await Promise.all([
                  // Total akreditasi aktif
                  Accreditation.count({
                     where: { active: true }
                  }),

                  // Total akreditasi nasional
                  Accreditation.count({
                     include: [{
                        model: Institution,
                        as: 'institution',
                        where: { type: 'Nasional' }
                     }],
                     where: { active: true }
                  }),

                  // Total akreditasi internasional
                  Accreditation.count({
                     include: [{
                        model: Institution,
                        as: 'institution',
                        where: { type: 'Internasional' }
                     }],
                     where: { active: true }
                  }),

                  // Akreditasi berakhir tahun ini
                  Accreditation.count({
                     where: {
                        active: true,
                        expired_on: {
                           [Op.between]: [
                              new Date(`${currentYear}-01-01`),
                              new Date(`${currentYear}-12-31`)
                           ]
                        }
                     }
                  }),

                  // Count by rank
                  Accreditation.findAll({
                     attributes: [
                        'rank',
                        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                     ],
                     where: { active: true },
                     group: ['rank'],
                     raw: true
                  })
               ]);

               const [totalAktif, totalNasional, totalInternasional, berakhirTahunIni, countByRank] = statistikUmum;

               const rankSummary = {
                  'Unggul': 0,
                  'Baik Sekali': 0,
                  'Baik': 0
               };

               countByRank.forEach(item => {
                  if (item.rank && rankSummary.hasOwnProperty(item.rank)) {
                     rankSummary[item.rank] = parseInt(item.count);
                  }
               });

               return res.json({
                  success: true,
                  data: {
                     totalAktif,
                     totalNasional,
                     totalInternasional,
                     berakhirTahunIni,
                     rankSummary
                  }
               });

            default:
               return res.status(400).json({
                  success: false,
                  message: 'Invalid data type'
               });
         }

      } catch (error) {
         console.error('Error fetching akreditasi data:', error);
         res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
         });
      }
   }
};

function formatYearlyData(rawData) {
   const yearlyData = rawData.reduce((acc, item) => {
      const year = item.year;
      if (!acc[year]) {
         acc[year] = [];
      }
      const existingItem = acc[year].find(i => i.rank === item.rank && i.institutionName === item['institutionName']);
      if (existingItem) {
         existingItem.count += parseInt(item.count);
      } else {
         acc[year].push({
            rank: item.rank,
            institutionName: item['institutionName'],
            count: parseInt(item.count)
         });
      }
      return acc;
   }, {});
   return yearlyData;
}