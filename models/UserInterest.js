const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class UserInterest extends Model {}

UserInterest.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    interestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Interests",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "UserInterest",
    tableName: "UserInterests",
  }
);

module.exports = UserInterest;
