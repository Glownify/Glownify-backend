import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Salon from "../models/Salon.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password -__v');
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - User not found" });
    }

    // Set user info to request
     // ✅ attach BOTH user + role info
    req.user = {
      ...user.toObject(),
      roleId: decoded.roleId, // 🔥 SalesExecutive._id
    };
    // req.user = user; 
    req.userId = user._id;

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Unauthorized - Token expired" });
    }

    res.status(500).json({ error: "Authentication failed" });
  }
};

export const isSalonOwner = async (req, res, next) => {
  console.log("Checking if user is Salon Owner. User role:", req.user?.role);
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== 'salon_owner') {
      return res.status(403).json({
        error: "Forbidden - Salon Owner access required",
        message: "User not authorized to access this resource"
      });
    }

    next();
  } catch (err) {
    console.error('Salon Owner check error:', err.message);
    res.status(500).json({ error: "Authorization check failed" });
  }
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: "Forbidden - Super Admin access required",
        message: "User not authorized to access this resource"
      });
    }

    next();
  } catch (err) {
    console.error('Super Admin check error:', err.message);
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// middleware/checkSubscription.js
export const checkSubscription = (req, res, next) => {
  try {
    const sub = req.user.subscription; // user comes from auth middleware

    if (!sub || !sub.endDate || sub.status !== "paid") {
      return res.status(403).json({ message: "No active subscription found" });
    }

    const now = new Date();
    const endDate = new Date(sub.endDate);

    if (endDate < now) {
      return res.status(403).json({ message: "Subscription has expired" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Subscription check failed" });
  }
};


export const isSalesExecutive = (req, res, next) => {
  try {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
  
    if (req.user.role !== "sales_executive") {
      return res.status(403).json({ 
        error: "Forbidden - Sales Executive access required",
        message: "Sales Executive access required"
      });
    }
    next();
  } catch (error) {
    console.error('Sales Executive check error:', error.message);
    res.status(500).json({ error: "Authorization check failed" });
  }
};


export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    }

    next();
  };
};
