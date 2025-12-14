const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Profile extends Model {
      static associate(models) {
         Profile.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Profile.init(
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
         phone_number: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
         },
         gender: {
            type: DataTypes.STRING,
            allowNull: true,
         },
         bio: {
            type: DataTypes.TEXT,
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
         modelName: "Profile",
         tableName: "profiles",
         timestamps: false,
      }
   );
   return Profile;
};
