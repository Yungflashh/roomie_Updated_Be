"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.adminId) {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }
        req.user = { userId: decoded.adminId, ...decoded };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
exports.authenticateAdmin = authenticateAdmin;
//# sourceMappingURL=admin.middleware.js.map