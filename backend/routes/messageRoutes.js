import express from 'express'
import protectRoute from '../middleware/protectRoute.js';
import { getConversations, sendMessage } from '../controllers/messageController.js';
import { getMessages } from '../controllers/messageController.js';
import mongoose from 'mongoose';
const router = express.Router();


router.get("/conversations", protectRoute, getConversations)
router.post('/', protectRoute, sendMessage);
router.get("/:otherUserId", protectRoute, getMessages);

export default router;