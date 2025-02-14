const express = require('express');
const gameRouter = express.Router();
const gameController = require('../controllers/gameController');

/**
 * @swagger
 * paths:
 *  /api/game/keyword/{count}:
 *    get:
 *      summary: "키워드 조회 API"
 *      description: "count 갯수만큼 키워드를 조회"
 *      tags: [Game]
 *      parameters:
 *      - name: count
 *        in: path
 *        required: true
 *        description: "요청 키워드 수"
 *        schema:
 *          type: integer
 *          default: 3
 *      responses:
 *        "200":
 *          description: 키워드 조회 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: true
 *                    message:
 *                      type: string
 *                      example: 키워드 n개 조회 성공
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          id:
 *                            type: integer
 *                          keyword:
 *                            type: string
 *                      example:
 *                          [
 *                            { "id": 1, "keyword": "레몬" },
 *                            { "id": 13, "keyword": "동물" },
 *                            { "id": 35, "keyword": "고양이" },
 *                            { "id": 49, "keyword": "산타클로스" },
 *                            { "id": 49, "keyword": "자동차" },
 *                          ]
 *        "400":
 *          description: 요청 키워드 수 0 이하
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: false
 *                    message:
 *                      type: string
 *                      example: 요청 키워드 수는 1개 이상이어야 합니다.
 *        "500":
 *          description: db 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: false
 *                    message:
 *                      type: string
 *                      example: 서버 에러
 *
 *
 */

gameRouter.get('/keyword/:count', gameController.getRandomKeyword);

/**
 * @swagger
 * paths:
 *  /api/game/score:
 *    get:
 *      summary: "최종 점수 집계 API"
 *      description: "유저 점수, 지역별 점수 합산"
 *      tags: [Game]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                scoreResult:
 *                  type: object
 *                  properties:
 *                      playerNick:
 *                        type: string
 *                        description: "유저 닉네임"
 *                        example: "소고기"
 *                      score:
 *                        type: number
 *                        description: "점수"
 *                        example: 85
 *      responses:
 *        "200":
 *          description: 키워드 조회 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: true
 *                    message:
 *                      type: string
 *                      example: 키워드 n개 조회 성공
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          id:
 *                            type: integer
 *                          keyword:
 *                            type: string
 *                      example:
 *                          [
 *                            { "id": 1, "keyword": "레몬" },
 *                            { "id": 13, "keyword": "동물" },
 *                            { "id": 35, "keyword": "고양이" },
 *                            { "id": 49, "keyword": "산타클로스" },
 *                            { "id": 49, "keyword": "자동차" },
 *                          ]
 *        "400":
 *          description: 유효하지 않은 요청 body
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: false
 *                    message:
 *                      type: string
 *                      example: 요청 body가 유효하지 않습니다.
 *        "500":
 *          description: db 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    isSuccess:
 *                      type: boolean
 *                      example: false
 *                    message:
 *                      type: string
 *                      example: 서버 에러
 */
gameRouter.post('/score', gameController.setFinalScore);

module.exports = gameRouter;
