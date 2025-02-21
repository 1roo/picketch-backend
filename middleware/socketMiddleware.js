exports.authSocketMiddleware = async (socket, next) => {
  try {
    const tokenHeader = socket.handshake.headers["authorization"];
    if (!tokenHeader.startsWith("Bearer")) throw new Error("잘못된 토큰 형식입니다.");
    const token = tokenHeader.split(" ")[1];
    console.log("토큰내용은 ", token);

    const userId = Number(token);
    socket.userId = userId;
    return next();
  } catch (err) {
    // 에러발생시 클라이언트에서 connect_error 이벤트로 소켓 연결 실패 수신
    console.log(err);
    return next(err);
  }
};
