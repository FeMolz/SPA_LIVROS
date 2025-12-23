import express from 'express';
import { searchUsers, sendRequest, getRequests, acceptRequest, getFriends, getFriendBooks } from '../controllers/friendController.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', verifyToken, searchUsers);
router.post('/request', verifyToken, sendRequest);
router.get('/requests', verifyToken, getRequests);
router.post('/accept', verifyToken, acceptRequest);
router.get('/', verifyToken, getFriends);
router.get('/:friendId/books', verifyToken, getFriendBooks);

export default router;
