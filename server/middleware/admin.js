// Admin check based on the user's role field ('user' or 'admin')
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
};
