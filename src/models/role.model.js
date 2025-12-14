const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Role extends Model {
      static associate(models) {
         Role.hasMany(models.User, {
            foreignKey: "role_id",
            as: "users",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Role.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
         },
         name: {
            type: DataTypes.STRING,
            allowNull: false,
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
         modelName: "Role",
         tableName: "roles",
         timestamps: false,
      }
   );
   return Role;
};
