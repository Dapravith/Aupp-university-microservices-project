const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please login first.'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized permission to access. Your role '${userRole}' does not have permission to access this resource. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
