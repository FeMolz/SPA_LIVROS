import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Book from '../models/Book.js';

export const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).send("Query is required");

        const users = await User.find({
            name: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('name email');

        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const sendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;

        if (receiverId === req.user._id) {
            return res.status(400).send("Cannot add yourself");
        }

        const existingRequest = await FriendRequest.findOne({
            sender: req.user._id,
            receiver: receiverId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).send("Request already sent");
        }

        const alreadyFriends = await User.findOne({
            _id: req.user._id,
            friends: receiverId
        });

        if (alreadyFriends) {
            return res.status(400).send("Already friends");
        }

        const request = new FriendRequest({
            sender: req.user._id,
            receiver: receiverId
        });

        await request.save();
        res.send("Request sent");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'pending'
        }).populate('sender', 'name email');

        res.json(requests);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).send("Request not found");
        if (request.receiver.toString() !== req.user._id) return res.status(403).send("Unauthorized");

        request.status = 'accepted';
        await request.save();

        const sender = await User.findById(request.sender);
        const receiver = await User.findById(request.receiver);

        if (!sender.friends.includes(receiver._id)) {
            sender.friends.push(receiver._id);
        }
        if (!receiver.friends.includes(sender._id)) {
            receiver.friends.push(sender._id);
        }

        await sender.save();
        await receiver.save();

        res.send("Friend request accepted");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Deduplicate friends list (self-healing)
        const uniqueFriends = [...new Set(user.friends.map(id => id.toString()))];

        if (uniqueFriends.length !== user.friends.length) {
            user.friends = uniqueFriends;
            await user.save();
        }

        // populate after ensuring uniqueness
        await user.populate('friends', 'name email');

        res.json(user.friends);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getFriendBooks = async (req, res) => {
    try {
        const friendId = req.params.friendId;

        // Verify friendship
        const isFriend = await User.findOne({
            _id: req.user._id,
            friends: friendId
        });

        if (!isFriend) {
            return res.status(403).send("Not friends with this user");
        }

        const books = await Book.find({ user: friendId });
        res.json(books);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const removeFriend = async (req, res) => {
    try {
        const friendId = req.params.friendId;

        await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });

        // Also remove any friend requests between them (optional but cleaner)
        await FriendRequest.deleteMany({
            $or: [
                { sender: req.user._id, receiver: friendId },
                { sender: friendId, receiver: req.user._id }
            ]
        });

        res.send("Friend removed");
    } catch (err) {
        res.status(500).send(err.message);
    }
};
