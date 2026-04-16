const parentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "parent") {
    return res.status(403).json({ message: "Access denied: parent only" });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied: student only" });
  }
  next();
};

module.exports = { parentOnly, studentOnly };