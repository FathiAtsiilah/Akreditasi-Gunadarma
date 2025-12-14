const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class User extends Model {
      static associate(models) {
         User.hasOne(models.Profile, {
            foreignKey: "user_id",
            as: "profile",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         User.belongsTo(models.Role, {
            foreignKey: "role_id",
            as: "role",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         User.belongsTo(models.Major, {
            foreignKey: "major_id",
            as: "major",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         User.hasMany(models.Log, {
            foreignKey: "user_id",
            as: "logs",
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   User.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         major_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         fullname: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
         },
         email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
         },
         password: {
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
         modelName: "User",
         tableName: "users",
         timestamps: false,
      }
   );
   return User;
};
