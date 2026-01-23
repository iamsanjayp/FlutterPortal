export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
}
