"use strict";
const ExcelService = require("../services/excel.service");

const filepathXLSX = "../seeders/files/xlsx/roles.xlsx";
const table = "roles";

module.exports = {
   up: async (queryInterface, Sequelize) => {
      try {
         const fromExcel = await ExcelService.convertExcelToJson(filepathXLSX);
         const transformedFromExcel = ExcelService.transformData(fromExcel);
         const toInsert = transformedFromExcel.map(async (item) => {
            return {
               code: item?.code,
               name: item?.name,
               created_on: new Date(),
               updated_on: new Date(),
               active: item?.active,
            };
         });
         const roles = await Promise.all(toInsert);
         await queryInterface.bulkInsert(table, roles, {});
      } catch (error) {
         console.error("Error seeding" + table + " :", error);
      }
   },

   down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete(table, null, {});
   },
};
