// controllers/chatController.js
import Message from models/Message;

// Fetch chat between two users
exports.getChat = async (req, res) => {
  const { user1Id, user2Id } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id },
      ],
    }).sort({ timestamp: 1 }); // Sort by oldest to newest

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch chat' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Unable to send message' });
  }
};
