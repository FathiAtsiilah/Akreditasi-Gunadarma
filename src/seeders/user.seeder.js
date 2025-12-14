"use strict";
const { QueryTypes } = require("sequelize")
const bcrypt = require("bcrypt");
const ExcelService = require("../services/excel.service");

const filepathXLSX = "../seeders/files/xlsx/users.xlsx";
const table = "users";

module.exports = {
   up: async (queryInterface, Sequelize) => {
      try {
         const fromExcel = await ExcelService.convertExcelToJson(filepathXLSX);
         const transformedFromExcel = ExcelService.transformData(fromExcel);
         const toInsert = transformedFromExcel.map(async (item) => {
            const role = await queryInterface.sequelize.query(
               `SELECT id FROM roles WHERE code = '${item?.roleCode}' LIMIT 1`,
               { type: QueryTypes.SELECT }
            );
            const major = await queryInterface.sequelize.query(
               `SELECT id FROM majors WHERE code = '${item?.majorCode}' LIMIT 1`,
               { type: QueryTypes.SELECT }
            );
            return {
               username: item?.username,
               fullname: item?.fullname,
               role_id: role[0]?.id,
               major_id: major[0]?.id,
               email: item?.email,
               password: await bcrypt.hash(item?.password, 10),
               active: item?.active,
               created_on: new Date(),
               updated_on: new Date(),
            };
         });
         const users = await Promise.all(toInsert);
         await queryInterface.bulkInsert(table, users, {});
      } catch (error) {
         console.error("Error seeding" + table + " :", error);
      }
   },

   down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete(table, null, {});
   },
};
