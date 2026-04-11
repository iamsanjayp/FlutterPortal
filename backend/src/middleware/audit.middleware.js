/**
 * Audit logging middleware — logs state-changing requests (POST, PATCH, PUT, DELETE)
 * performed by authenticated users.
 */
export function auditLog(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  res.on("finish", () => {
    const userId = req.user?.id ?? "anonymous";
    const role = req.user?.roleId ?? "-";
    console.log(
      `[AUDIT] ${new Date().toISOString()} | user=${userId} role=${role} | ${req.method} ${req.originalUrl} | status=${res.statusCode}`
    );
  });

  next();
}
