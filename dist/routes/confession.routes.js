"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/confession.routes.ts
const express_1 = require("express");
const confession_controller_1 = __importDefault(require("../controllers/confession.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', confession_controller_1.default.createConfession);
router.get('/group/:groupId', confession_controller_1.default.getGroupConfessions);
router.post('/:confessionId/react', confession_controller_1.default.addReaction);
router.post('/:confessionId/reply', confession_controller_1.default.addReply);
router.post('/:confessionId/replies/:replyIndex/react', confession_controller_1.default.addReplyReaction);
router.post('/:confessionId/report', confession_controller_1.default.reportConfession);
router.delete('/:confessionId', confession_controller_1.default.deleteConfession);
exports.default = router;
//# sourceMappingURL=confession.routes.js.map