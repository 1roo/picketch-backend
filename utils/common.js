/**
 * API 성공 응답을 보내는 함수
 * @param {Response} res Express Response 객체
 * @param {string} message 성공 메시지 (기본값: "Success")
 * @param {Object|null} data 응답 데이터 (기본값: null)
 * @param {number} statusCode HTTP 상태 코드 (기본값: 200)
 */

// 성공 응답
exports.success = (res, message = "Success", data = null, statusCode = 200) => {
  console.log(message, data);

  const response = {
    code: "SU",
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

/**
 * 서버 에러가 났을 때 실행될 코드 모음
 * @param {Response} res Express Response 객체
 * @param {number} statusCode HTTP 상태 코드
 * @param {string} code 에러 코드 (예: "DBE", "RF")
 * @param {string} message 클라이언트에게 보낼 메시지
 * @param {Error} [err] 에러 객체 (서버 로그용, 선택 사항)
 */

// 공통 에러 응답 함수
const sendErrorResponse = (res, statusCode, code, message, err) => {
  if (err) console.error(`[${code}] ${message}`, err);
  res.status(statusCode).json({ code, message });
};

// 데이터베이스 오류 (500)
exports.databaseError = (res, err) =>
  sendErrorResponse(res, 500, "DBE", "Database error.", err);

// 유효성 검사 실패 (400)
exports.validationError = (res, err) =>
  sendErrorResponse(res, 400, "VF", "Validation failed.", err);

// 중복 닉네임 오류 (400)
exports.duplicateNickname = (res, err) =>
  sendErrorResponse(res, 400, "DN", "Duplicated nickname.", err);

// 인증 실패 (401) - Refresh Token 유효하지 않음
exports.invalidRefreshToken = (res, err) =>
  sendErrorResponse(res, 401, "RF", "Invalid refresh token.", err);

// 인증 실패 (401) - 로그인 실패
exports.signInFailed = (res, err) =>
  sendErrorResponse(res, 401, "SF", "Login information mismatch.", err);

// 인증 실패 (401) - 권한 인증 실패
exports.authorizationFailed = (res, err) =>
  sendErrorResponse(res, 401, "AF", "Authorization Failed.", err);

// 이미 로그아웃된 경우 (400)
exports.alreadyLoggedOut = (res, err) =>
  sendErrorResponse(res, 400, "AF", "Already logged out.", err);

// 유효성 검사 실패 (400) - 서버로 에러 메세지 전달하는 경우
exports.validationErrorWithMessage = (res, message, err) =>
  sendErrorResponse(res, 400, "VF", message, err);
