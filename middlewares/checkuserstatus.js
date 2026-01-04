import User from "../models/User.js";

export const checkUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User Not Found" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account is blocked. Contact Super Admin." });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
