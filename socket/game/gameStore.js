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
//     isWaiting : true,
//     keywords : ["사과","수박",....], // 전체 라운드만큼 가지고 있음
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
