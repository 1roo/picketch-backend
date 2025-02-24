const { User, Region } = require("../models");
const {
  success,
  duplicateNickname,
  databaseError,
  validationError,
} = require("../utils/common");

const userController = {
  // 닉네임 중복 확인
  checkNickname: async (req, res) => {
    try {
      const { nickname } = req.query;

      if (!nickname) {
        return validationError(res);
      }

      const existingUser = await User.findOne({ where: { nickname } });

      if (existingUser) {
        return duplicateNickname(res);
      }

      success(res, "Success");
    } catch (err) {
      databaseError(res, err);
    }
  },

  // 프로필 생성
  createProfile: async (req, res) => {
    try {
      const { nickname, character, regionId } = req.body;
      const userId = req.user.user_id;

      if (!nickname || !character || !regionId) {
        return validationError(res);
      }

      await User.update(
        {
          nickname,
          character,
          region_id: regionId,
        },
        { where: { user_id: userId } },
      );

      const updatedUser = await User.findOne({
        where: { user_id: userId },
        include: [
          {
            model: Region,
            required: true,
          },
        ],
        attributes: ["user_id", "nickname", "character", "region_id", "user_score"],
        raw: true,
        nest: true,
      });

      success(res, "Success", {
        userId: updatedUser.user_id,
        nickname: updatedUser.nickname,
        character: updatedUser.character,
        regionId: updatedUser.region_id,
        region: updatedUser.region.region,
        score: updatedUser.user_score || 0,
      });
    } catch (err) {
      databaseError(res, err);
    }
  },

  // 유저 조회
  getUser: async (req, res) => {
    try {
      const userId = req.user.user_id;

      const user = await User.findOne({
        where: { user_id: userId },
        include: [
          {
            model: Region,
            required: true,
          },
        ],
        attributes: [
          "user_id",
          "social_type",
          "nickname",
          "character",
          "region_id",
          "user_score",
        ],
        raw: true,
        nest: true,
      });

      success(res, "Success", {
        socialType: user.social_type,
        nickname: user.nickname,
        character: user.character,
        regionId: user.region_id,
        region: user.region?.region,
        userScore: user.user_score || 0,
      });
    } catch (err) {
      databaseError(res, err);
    }
  },

  // 유저 정보 수정
  patchUser: async (req, res) => {
    try {
      const { nickname, character } = req.body;
      const userId = req.user.user_id;

      if (!nickname || !character) {
        return validationError(res);
      }

      await User.update(
        {
          nickname,
          character,
        },
        { where: { user_id: userId } },
      );

      success(res, "Success");
    } catch (err) {
      databaseError(res, err);
    }
  },

  // 회원 탈퇴 (Soft delete)
  deleteUser: async (req, res) => {
    try {
      const userId = req.user.user_id;

      await User.update(
        {
          is_deleted: true,
          status: "OFFLINE",
          last_seen: new Date(),
        },
        { where: { user_id: userId } },
      );

      success(res, "Success");
    } catch (err) {
      databaseError(res, err);
    }
  },
};

module.exports = userController;
