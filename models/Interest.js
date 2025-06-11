const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class Interest extends Model {}

Interest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
  },
  {
    sequelize,
    modelName: "Interest",
    tableName: "Interests",
  }
);

module.exports = Interest;
