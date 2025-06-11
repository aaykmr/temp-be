"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "latitude", {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "longitude", {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "radius", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 50,
    });
    await queryInterface.addColumn("Users", "minAge", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 18,
    });
    await queryInterface.addColumn("Users", "maxAge", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 99,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "latitude");
    await queryInterface.removeColumn("Users", "longitude");
    await queryInterface.removeColumn("Users", "radius");
    await queryInterface.removeColumn("Users", "minAge");
    await queryInterface.removeColumn("Users", "maxAge");
  },
};
