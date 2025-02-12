exports.getLogin = (req, res) => {
  res.send("response from api-server: [GET /api-server]");
};

//임시 데이터
const users = [
  { id: 1, name: "유저1" },
  { id: 2, name: "유저2" },
  { id: 3, name: "유저3" },
];

/**
 * @path {GET} http://localhost:8080/api/user/users
 * @description 요청 데이터 값이 없고 반환 값이 있는 GET Method
 */

exports.getUsers = (req, res) => {
  //유저 정보 반환
  res.json({ ok: true, users: users });
};
