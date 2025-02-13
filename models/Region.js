const Region = (sequelize, DataTypes) => {
  return sequelize.define(
    "region",
    {
      region_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "고유 지역 id",
      },
      region: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "지역명",
      }, // 서울시 기준 '구'
      region_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "누적 점수",
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    },
  );
};

module.exports = Region;
