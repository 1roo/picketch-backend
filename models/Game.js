const Game = (sequelize, DataTypes) => {
  return sequelize.define(
    "game",
    {
      game_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        comment: "고유 생성 게임 id",
      },
      name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: "게임방 이름",
      },
      manager: { type: DataTypes.INTEGER, allowNull: false, comment: "게임 방장" },
      is_lock: { type: DataTypes.BOOLEAN, allowNull: false, comment: "비밀번호 유무" },
      pw: { type: DataTypes.INTEGER(50), allowNull: true, comment: "비밀번호" },
      round: { type: DataTypes.INTEGER(50), allowNull: false, comment: "라운드 수" },
      is_waiting: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "시작 대기중인 게임 여부",
      },
    },
    {
      tableName: "game",
      freezeTableName: true,
      timestamps: false,
    },
  );
};

module.exports = Game;
