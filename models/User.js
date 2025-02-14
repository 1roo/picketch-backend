const User = (sequelize, DataTypes) => {
  return sequelize.define(
    "user",
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "고유 사용자 id",
      },
      social_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "소셜 로그인 id",
      },
      social_type: {
        type: DataTypes.ENUM("KAKAO", "GOOGLE", "NAVER"),
        allowNull: false,
        comment: "소셜 로그인 유형",
      },
      nickname: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: "닉네임",
      },
      character: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "캐릭터 이미지",
      },
      region_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "지역 id",
      },
      user_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "누적 점수",
      },
      status: {
        type: DataTypes.ENUM("ONLINE", "OFFLINE", "IN_GAME"),
        defaultValue: "OFFLINE",
        allowNull: false,
        comment: "유저 상태",
      },
      last_seen: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "마지막 접속 시간",
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "탈퇴 여부",
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      updatedAt: "update_date",
      createdAt: "create_date",
      indexes: [
        {
          fields: ["nickname"],
          name: "idx_nickname",
          unique: true,
        }, // 닉네임 중복 체크용
        {
          fields: ["social_id", "social_type"],
          name: "idx_social_login",
          unique: true,
        }, // 소셜 로그인 조회용
        {
          fields: ["region_id", "user_score"],
          name: "idx_region_score",
        }, // 지역별 사용자 순위 조회용
      ],
    },
  );
};

module.exports = User;
