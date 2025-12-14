"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("notifications", {
         id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
         },
         type: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         title: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         description: {
            type: Sequelize.TEXT,
            allowNull: true,
         },
         image:{
            type: Sequelize.STRING,
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
      await queryInterface.dropTable("notifications");
   },
};
