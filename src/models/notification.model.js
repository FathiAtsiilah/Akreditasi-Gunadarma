const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Notification extends Model {
      static associate(models) {
      }
   }
   Notification.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         type: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         title: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
         },
         image: {
            type: DataTypes.STRING,
            allowNull: true,
         },
         created_on: {
            type: DataTypes.DATE,
            allowNull: false,
         },
         updated_on: {
            type: DataTypes.DATE,
            allowNull: false,
         },
         active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
         },
         data: {
            type: DataTypes.JSON,
            allowNull: true,
         },
      },
      {
         sequelize,
         modelName: "Notification",
         tableName: "notifications",
         timestamps: false,
      }
   );
   return Notification;
};
