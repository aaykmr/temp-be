const User = require("./User");
const Interest = require("./Interest");
const UserInterest = require("./UserInterest");

// Set up associations
User.belongsToMany(Interest, {
  through: UserInterest,
  foreignKey: "userId",
  otherKey: "interestId",
  as: "interests",
});

Interest.belongsToMany(User, {
  through: UserInterest,
  foreignKey: "interestId",
  otherKey: "userId",
  as: "users",
});

module.exports = {
  User,
  Interest,
  UserInterest,
};
