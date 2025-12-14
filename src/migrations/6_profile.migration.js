"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("profiles", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            phone_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            gender: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            bio: {
                type: Sequelize.TEXT,
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
        await queryInterface.dropTable("profiles");
    },
};
