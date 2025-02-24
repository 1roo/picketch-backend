// {[socket_id] : { nickname : string, user_id: number, gameId :number, character : string, region:string}
exports.socketUsersInfo = {};

// {
//   [game_id] : {
//     name : "1번째방",
//     currentTurnUserId : 0 // 누구차례인지
//     currentRound : 2 // 현재라운드 / 전체라운드중(4턴) - players 한바퀴 순서 다 돌면 currentRound +1,
//     isAnswerFound : false,
//     maxRound  : 4, // 요청할때 받는 값,
//     isLock : true,
//     pw : "1234"
//     manager : 1
//     isWaiting : true, // 게임 대기중 or 게임 시작
//     keywords : ["사과","수박",....], // 전체 라운드만큼 가지고 있음,
//     currentRoundKeyword : "사과", // 현재 라운드의 정답
//     isAnswerFound : false, // 현재 라운드 정답 제출 여부
//     isNextRoundSettled : true, // 다음 라운드 설정값 세팅 여부
//     isGameEnd : false, // 게임종료 처리 여부
//     players : [
//       {
//         userId : 1,
//         nickname : "고기고기"
//         score : 0,
//         ready : false,
//         character : "디폴트",
//         region : "동작구"
//       }
//     ]
//   }
// }
exports.socketGamesInfo = {};
