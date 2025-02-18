// {[socket_id] : { nickname : string, user_id: number, gameId :number}
exports.socketUsersInfo = {};

// {
//   [game_id] : {
//     currentTurn : 0
//     currentRound : 2
//     limitRound  : 8,
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
