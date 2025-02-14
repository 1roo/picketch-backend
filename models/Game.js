const Game = (sequelize, DataTypes) => {
  return sequelize.define(
    "game",
    {
      game_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(30), allowNull: false },
      manager: { type: DataTypes.INTEGER, allowNull: false },
      is_lock: { type: DataTypes.BOOLEAN, allowNull: false },
      pw: { type: DataTypes.STRING(20), allowNull: true },
      round: { type: DataTypes.INTEGER(50), allowNull: false },
    },
    {
      tableName: "game",
      freezeTableName: true,
      timestamps: false,
    },
  );
};

module.exports = Game;
