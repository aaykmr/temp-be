const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    radius: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 50,
    },
    minAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 18,
    },
    maxAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 99,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "Users",
  }
);

module.exports = User;
