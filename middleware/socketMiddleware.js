const jwt = require("jsonwebtoken");
const db = require("../models");

exports.authSocketMiddleware = async (socket, next) => {
  try {
    const tokenHeader = socket.handshake.headers["authorization"];
    if (!tokenHeader.startsWith("Bearer")) throw new Error("잘못된 토큰 형식입니다.");
    const token = tokenHeader.split(" ")[1];
    console.log("토큰내용은 ", token);
    // if (!token) {
    //   throw new Error("토큰값이 존재 하지 않습니다.");
    // }

    // 토큰 복호화
    // const auth = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    //   if (err) {
    //     let message;
    //     if (err.name === "TokenExpiredError") {
    //       message = "토큰이 만료되었습니다.";
    //     } else if (err.name === "JsonWebTokenError") {
    //       message = "토큰값이 잘못되었습니다.";
    //     } else {
    //       message = "기타 토큰 에러";
    //     }
    //     return next(new Error(message));
    //   } else {
    //     // 복호화 성공시
    //     decoded.userId = auth.user_id;
    //     return next();
    //   }
    // });
    socket.userId = 3;

    // user_id값의 실제 유저 존재 여부 확인(토큰 변조)
    const user = await db.User.findByPk(socket.userId);
    if (!user) {
      return next(new Error("존재하지 않는 유저입니다."));
    }
    return next();
  } catch (err) {
    // 에러발생시 클라이언트에서 connect_error 이벤트로 소켓 연결 실패 수신
    console.log(err);
    return next(err);
  }
};
