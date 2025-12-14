const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Institution extends Model {
      static associate(models) {
         Institution.hasMany(models.Accreditation, {
            foreignKey: "institution_id",
            as: "accreditations",
            timestamps: false,
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
         });
      }
   }
   Institution.init(
      {
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         type: {
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
         modelName: "Institution",
         tableName: "institutions",
         timestamps: false,
      }
   );
   return Institution;
};

