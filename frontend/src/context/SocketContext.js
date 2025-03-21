context/SocketContext.js
import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useRecoilValue } from "recoil";
import userAtom from "../../atoms/userAtom";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
}
export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const user = useRecoilValue(userAtom);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      query: {
        userId: user?._id
      }
    })
    setSocket(socket);

    socket.on("getOnlineUser", (users) => {
      setOnlineUsers(users);
    });


    // socket.on("disconnect", () => {
    //   console.log("user disconnected:", socket.id);
    // });

    return () => socket && socket.close();
  }, [user?._id]);
  console.log(onlineUsers, "Online Users");

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}