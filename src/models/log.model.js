const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Log extends Model {
      static associate(models) {
         Log.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Log.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         action: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         data: {
            type: DataTypes.JSON,
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
      },
      {
         sequelize,
         modelName: "Log",
         tableName: "logs",
         timestamps: false,
      }
   );
   return Log;
};

