import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "snxwfairies-live-interpreter-secret-2026";

export function signToken(payload: Record<string, any>, expiresIn: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.userId = verifyToken(token).userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = verifyToken(token);
    if (!payload.isAdmin) return res.status(403).json({ error: "Not admin" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
