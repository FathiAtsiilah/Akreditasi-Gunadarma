"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "roles",
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
            fullname: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
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
        await queryInterface.dropTable("users");
    },
};
