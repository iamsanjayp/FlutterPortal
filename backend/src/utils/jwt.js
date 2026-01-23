import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export function signAccessToken(user) {
  const sessionId = uuidv4();

  const token = jwt.sign(
    {
      userId: user.id,
      roleId: user.role_id,
      sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY,
    }
  );

  return { token, sessionId };
}
