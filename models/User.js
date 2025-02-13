const User = (sequelize, DataTypes) => {
  return sequelize.define(
    'user',
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: '고유 사용자 id',
      },
      social_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: '소셜 로그인 id',
      },
      social_type: {
        type: DataTypes.ENUM('KAKAO', 'GOOGLE', 'NAVER'),
        allowNull: false,
        comment: '소셜 로그인 유형',
      },
      nickname: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: '닉네임',
      },
      character: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '캐릭터 이미지',
      },
      region_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '지역 id',
      },
      user_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '누적 점수',
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '탈퇴 여부',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      updatedAt: 'update_date',
      createdAt: 'create_date',
    },
  );
};

module.exports = User;
