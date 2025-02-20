const Keyword = (sequelize, DataTypes) => {
  return sequelize.define(
    "keyword",
    {
      keyword_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        comment: "고유 키워드 id",
      },
      keyword: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "키워드 내용",
      },
    },
    {
      tableName: "keyword",
      timestamps: false,
      freezeTableName: true,
    },
  );
};

module.exports = Keyword;
