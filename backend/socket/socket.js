import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/messageMode.js';
import Conversation from '../models/convoModel.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

export const getRecipientSocketId = (recipientId) => {
  return useSocketMap[recipientId];
}

const useSocketMap = {};

io.on("connection", (socket) => {
  console.log("user connected : ", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId != "undefined") {
    useSocketMap[userId] = socket.id;
  }
  io.emit("getOnlineUser", Object.keys(useSocketMap));

  socket.on('markMessagesAsSeen', async ({ conversationId, userId }) => {
    try {
      await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
      await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });


      io.to(useSocketMap[userId]).emit("messagesSeen", { conversationId });
    } catch (error) {
      console.log(error);
    }
  })


  socket.on("disconnect", () => {
    console.log("user disconnected");
    if (userId in useSocketMap) {
      delete useSocketMap[userId];
      io.emit("getOnlineUser", Object.keys(useSocketMap));
    }
  });
});

export { io, server, app };