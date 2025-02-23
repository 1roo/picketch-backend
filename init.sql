-- Active: 1732688622705@@127.0.0.1@3306@picketch
CREATE DATABASE picketch
    DEFAULT CHARACTER SET = 'utf8mb4';

INSERT INTO region (region, region_score)
VALUES
    ('강남구', 0),
    ('강동구', 0),
    ('강북구', 0),
    ('강서구', 0),
    ('관악구', 0),
    ('광진구', 0),
    ('구로구', 0),
    ('금천구', 0),
    ('노원구', 0),
    ('도봉구', 0),
    ('동대문구', 0),
    ('동작구', 0),
    ('마포구', 0),
    ('서대문구', 0),
    ('서초구', 0),
    ('성동구', 0),
    ('성북구', 0),
    ('송파구', 0),
    ('양천구', 0),
    ('영등포구', 0),
    ('용산구', 0),
    ('은평구', 0),
    ('종로구', 0),
    ('중구', 0),
    ('중랑구', 0);


INSERT INTO `user` (social_id, social_type, nickname, `character`, region_id, user_score, status,create_date,update_date)
VALUES
('fff', 'NAVER', '훈이', 'default_character.png', 1, 0, 'OFFLINE',NOW(),NOW()),
('asldkf', 'GOOGLE', '짱구', 'default_character.png', 2, 100, 'ONLINE',NOW(),NOW()),
('sdkkdkdk', 'KAKAO', '맹구', 'default_character.png', 3, 300, 'ONLINE',NOW(),NOW()),
('ffjfjfjj', 'NAVER', '철수', 'default_character.png', 4, 500, 'OFFLINE',NOW(),NOW()),
('alalalala', 'KAKAO', '유리', 'default_character.png', 5, 10, 'IN_GAME',NOW(),NOW()),
('dkdkeieknvk', 'GOOGLE', '채송화', 'default_character.png', 6, 320, 'OFFLINE',NOW(),NOW()),
('skfjwelir', 'NAVER', '나미리', 'default_character.png', 3, 1000, 'ONLINE',NOW(),NOW()),
('askdfkl', 'KAKAO', '엄마', 'default_character.png', 10, 780, 'OFFLINE',NOW(),NOW()),
('kfjierjiweroio', 'NAVER', '흰둥이', 'default_character.png', 5, 90, 'IN_GAME',NOW(),NOW());

UPDATE user set user_score = user_score+20 WHERE user_id=5;
UPDATE region set region_score = region_score+2000 WHERE region_id>23;

INSERT INTO `notification`(`from_user_id`,`user_id`,`notification_type`,response_status,`content`,create_date,`updatedAt`)
VALUES
(1,10,'FRIEND_REQUEST','PENDING','훈이님이 친구 요청을 보냈습니다.',NOW(),NOW()),
(2,10,'FRIEND_REQUEST','PENDING','짱구님이 친구 요청을 보냈습니다.',NOW(),NOW());
INSERT INTO `notification`(`from_user_id`,`user_id`,`notification_type`,response_status,`content`,create_date,`updatedAt`)
VALUES(4,10,'FRIEND_REQUEST','PENDING','철수님이 친구 요청을 보냈습니다.',NOW(),NOW()),
(5,10,'FRIEND_REQUEST','PENDING','유리님이 친구 요청을 보냈습니다.',NOW(),NOW());
INSERT INTO `notification`(`from_user_id`,`user_id`,`notification_type`,response_status,`content`,create_date,`updatedAt`)
VALUES
(6,10,'FRIEND_REQUEST','PENDING','채송화님이 친구 요청을 보냈습니다.',NOW(),NOW());
(7,10,'FRIEND_REQUEST','PENDING','나미리님이 친구 요청을 보냈습니다.',NOW(),NOW()),
(8,10,'FRIEND_REQUEST','PENDING','엄마님이 친구 요청을 보냈습니다.',NOW(),NOW());

