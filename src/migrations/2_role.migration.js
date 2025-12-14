"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("roles", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
        await queryInterface.dropTable("roles");
    },
};
