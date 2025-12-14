const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Accreditation extends Model {
      static associate(models) {
         Accreditation.belongsTo(models.Major, {
            foreignKey: "major_id",
            as: "major",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
         Accreditation.belongsTo(models.Institution, {
            foreignKey: "institution_id",
            as: "institution",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Accreditation.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         major_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         institution_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
         rank: {
            type: DataTypes.INTEGER,
            allowNull: false,
         },
         year: {
            type: DataTypes.DATE,
            allowNull: true,
         },
         expired_on: {
            type: DataTypes.DATE,
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
         modelName: "Accreditation",
         tableName: "accreditations",
         timestamps: false,
      }
   );
   return Accreditation;
};
