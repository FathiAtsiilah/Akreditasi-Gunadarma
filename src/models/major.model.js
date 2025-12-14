const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Major extends Model {
      static associate(models) {
         Major.hasMany(models.User, {
            foreignKey: "major_id",
            as: "users",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         Major.hasMany(models.Accreditation, {
            foreignKey: "major_id",
            as: "accreditations",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         Major.belongsTo(models.Faculty, {
            foreignKey: "faculty_id",
            as: "faculty",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Major.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         faculty_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         level: {
            type: DataTypes.STRING,
            allowNull: true,
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
         modelName: "Major",
         tableName: "majors",
         timestamps: false,
      }
   );
   return Major;
};
