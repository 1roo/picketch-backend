// 게임방 리스트 조회
exports.getGameRoom = (req, res) => {
  res.send("game room 조회");
};

// 게임방 생성
exports.addGameRoom = (req, res) => {
  res.send("game room 생성");
};

// 게임방 삭제
exports.deleteGameRoom = (req, res) => {
  res.send("game room 삭제");
};
