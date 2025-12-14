"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("accreditations", {
         id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
         },
         institution_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "institutions",
               key: "id",
            },
         },
         major_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "majors",
               key: "id",
            },
         },
         code: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
         },
         name: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         rank: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         year: {
            type: Sequelize.DATE,
            allowNull: true,
         },
         expired_on: {
            type: Sequelize.DATE,
            allowNull: true,
         },
         data: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: {},
         },
         active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
         },
         created_on: {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date(),
         },
         updated_on: {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date(),
         },
      });
   },

   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("accreditations");
   },
};
