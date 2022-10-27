module.exports = (sequelize, Sequelize, DataTypes) => {
    const Role = sequelize.define("roles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isactive: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
    });
    return Role;
  };