const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Faculty extends Model {
      static associate(models) {
         Faculty.hasMany(models.Major, {
            foreignKey: "faculty_id",
            as: "majors",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Faculty.init(
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
         modelName: "Faculty",
         tableName: "faculties",
         timestamps: false,
      }
   );
   return Faculty;
};

