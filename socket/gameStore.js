// {[socket_id] : { nickname : string, user_id: number, gameId :number}
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
//     isWaiting : true,
//     keyword : "사과",
//     players : [
//       {
//         userId : 1,
//         nickname : "고기고기"
//         score : 0,
//         ready : false
//       }
//     ]
//   }
// }
exports.socketGamesInfo = {};
