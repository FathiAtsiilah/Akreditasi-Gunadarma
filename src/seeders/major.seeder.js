"use strict";
const ExcelService = require("../services/excel.service");
const { QueryTypes } = require("sequelize")

const filepathXLSX = "../seeders/files/xlsx/majors.xlsx";
const table = "majors";

module.exports = {
   up: async (queryInterface, Sequelize) => {
      try {
         const fromExcel = await ExcelService.convertExcelToJson(filepathXLSX);
         const transformedFromExcel = ExcelService.transformData(fromExcel);
         const toInsert = transformedFromExcel.map(async (item) => {
            const faculty = await queryInterface.sequelize.query(
               `SELECT id FROM faculties WHERE code = '${item?.facultyCode}' LIMIT 1`,
               { type: QueryTypes.SELECT }
            );
            return {
               faculty_id: faculty[0]?.id,
               level: item?.level,
               code: item?.code,
               name: item?.name,
               created_on: new Date(),
               updated_on: new Date(),
               active: item?.active,
            };
         });
         const majors = await Promise.all(toInsert);
         await queryInterface.bulkInsert(table, majors, {});
      } catch (error) {
         console.error("Error seeding" + table + " :", error);
      }
   },

   down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete(table, null, {});
   },
};
