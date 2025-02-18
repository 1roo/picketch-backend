const jwt = require("jsonwebtoken");
const axios = require("axios");
const { User } = require("../models");
const {
  success,
  signInFailed,
  invalidRefreshToken,
  authorizationFailed,
  databaseError,
  alreadyLoggedOut,
} = require("../utils/common");

// 토큰 생성
const generateTokens = (user) => {
  const accessToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "14d" },
  );

  return { accessToken, refreshToken };
};

const authController = {
  // 토큰 갱신
  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const auth = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findByPk(auth.user_id);
      if (!user || user.is_deleted) {
        return invalidRefreshToken(res);
      }

      await User.update(
        {
          status: "ONLINE",
          last_seen: new Date(),
        },
        { where: { user_id: user.user_id } },
      );

      const accessToken = jwt.sign(
        {
          user_id: user.user_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      success(res, "Success", {
        accessToken,
        expirationTime: 3600,
      });
    } catch (err) {
      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return invalidRefreshToken(res, err);
      }
      databaseError(res, err);
    }
  },

  // 카카오 로그인
  kakaoLogin: async (req, res) => {
    try {
      const { accessToken } = req.body;

      const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const kakaoId = response.data.id.toString();

      let user = await User.findOne({
        where: {
          social_id: kakaoId,
          social_type: "KAKAO",
        },
      });

      if (!user) {
        try {
          user = await User.create({
            social_id: kakaoId,
            social_type: "KAKAO",
            status: "OFFLINE",
            nickname: `T_${Date.now()}`, // 임시 닉네임
            character: "default_character.png", // 기본 캐릭터
            region_id: 1, // 기본 지역 ID
          });
        } catch (err) {
          return databaseError(res, err);
        }
      }

      await User.update(
        {
          status: "ONLINE",
          last_seen: new Date(),
        },
        { where: { user_id: user.user_id } },
      );
      user = await User.findByPk(user.user_id);

      const tokens = generateTokens(user);

      const hasProfile = !!(
        user.nickname &&
        !user.nickname.startsWith("T_") &&
        user.character !== "default_character.png" &&
        user.region_id
      );

      success(res, "Success", {
        ...tokens,
        hasProfile,
        tokenType: "Bearer",
        expirationTime: 3600,
      });
    } catch (err) {
      if (err.response || err.request) {
        return signInFailed(res, err);
      }
      databaseError(res, err);
    }
  },

  // 구글 로그인
  googleLogin: async (req, res) => {
    try {
      const { accessToken } = req.body;

      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${accessToken}`,
      );

      const googleId = response.data.sub;

      let user = await User.findOne({
        where: {
          social_id: googleId,
          social_type: "GOOGLE",
        },
      });

      if (!user) {
        try {
          user = await User.create({
            social_id: googleId,
            social_type: "GOOGLE",
            status: "OFFLINE",
            nickname: `T_${Date.now()}`, // 임시 닉네임
            character: "default_character.png", // 기본 캐릭터
            region_id: 1, // 기본 지역 ID
          });
        } catch (err) {
          return databaseError(res, err);
        }
      }

      await User.update(
        {
          status: "ONLINE",
          last_seen: new Date(),
        },
        { where: { user_id: user.user_id } },
      );

      user = await User.findByPk(user.user_id);

      const tokens = generateTokens(user);

      const hasProfile = !!(
        user.nickname &&
        !user.nickname.startsWith("T_") &&
        user.character !== "default_character.png" &&
        user.region_id
      );

      success(res, "Success", {
        ...tokens,
        hasProfile,
        tokenType: "Bearer",
        expirationTime: 3600,
      });
    } catch (error) {
      if (error.response || error.request) {
        return signInFailed(res, error);
      }
      databaseError(res, error);
    }
  },

  // 네이버 로그인
  naverLogin: async (req, res) => {
    try {
      const { accessToken } = req.body;

      const response = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const naverId = response.data.response.id;

      let user = await User.findOne({
        where: {
          social_id: naverId,
          social_type: "NAVER",
        },
      });

      if (!user) {
        try {
          user = await User.create({
            social_id: naverId,
            social_type: "NAVER",
            status: "OFFLINE",
            nickname: `T_${Date.now()}`, // 임시 닉네임
            character: "default_character.png", // 기본 캐릭터
            region_id: 1, // 기본 지역 ID
          });
        } catch (error) {
          return databaseError(res, error);
        }
      }

      await User.update(
        {
          status: "ONLINE",
          last_seen: new Date(),
        },
        { where: { user_id: user.user_id } },
      );

      user = await User.findByPk(user.user_id);

      const tokens = generateTokens(user);

      const hasProfile = !!(user.nickname && user.character && user.region_id);

      success(res, "Success", {
        ...tokens,
        hasProfile,
        tokenType: "Bearer",
        expirationTime: 3600,
      });
    } catch (error) {
      if (error.response || error.request) {
        return signInFailed(res, error);
      }
      databaseError(res, error);
    }
  },

  // 로그아웃
  logout: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const user = await User.findByPk(userId);

      if (!user) {
        return authorizationFailed(res);
      }

      if (user.status === "OFFLINE") {
        return alreadyLoggedOut(res);
      }

      await User.update(
        { status: "OFFLINE", last_seen: new Date() },
        { where: { user_id: userId } },
      );

      success(res, "Success");
    } catch (error) {
      databaseError(res, error);
    }
  },
};

module.exports = authController;
