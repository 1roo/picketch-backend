const { DataTypes } = require('sequelize');

const Keyword = (sequelize) => {
  return sequelize.define(
    'Keyword',
    {
      keywordId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      keyword: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: 'keyword',
      timestamps: false,
      freezeTableName: true,
      underscored: true,
    }
  );
};

module.exports = Keyword;
