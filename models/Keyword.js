const Keyword = (sequelize,DataTypes) => {
  return sequelize.define(
    'keyword',
    {
      keyword_id: {
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
    }
  );
};

module.exports = Keyword;
