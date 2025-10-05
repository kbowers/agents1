import jwt from 'jsonwebtoken';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
//# sourceMappingURL=auth.js.map