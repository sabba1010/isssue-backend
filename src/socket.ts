import http from "http";
import { Server } from "socket.io";
import {
  BackgroundType,
  DisableButton,
  Message,
  UserType,
} from "./utils/types";
import { ROOM_ID } from "./utils/constant";

function socket(
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL?.split(","),
    },
  });
  return io;
}

interface UserWithSocketID extends UserType {
  socketID: string;
}

// stores the socket id of every user that is in the room
let roomUsers: string[] = [];

let onlineUsers: Partial<UserWithSocketID>[] = [];
const roomMap: Map<string, string[]> = new Map();
export function SocketInitialze(
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) {
  const io = socket(server);
  io.on("connection", (socket) => {
    console.log("user connected");
    socket.on("connected", (data?: UserType) => {
      // user is not logged in
      if (!data?.email) {
        // checking if user already exists in online users
        const sockedIdExists = onlineUsers.find(
          (user) => user.socketID === socket.id
        );
        if (sockedIdExists) {
          // if user exists then update the socket id and update the profile pic
          onlineUsers = onlineUsers.map((user) => {
            if (user.socketID === socket.id)
              return {
                name: data?.name || "User",
                email: "",
                race: data?.race || "Race",
                socketID: socket.id,
              };
            return user;
          });
          io.emit("online-users", onlineUsers);
          return;
        }
        onlineUsers.push({
          name: data?.name || "User",
          email: "",
          race: data?.race || "Race",
          socketID: socket.id,
        });
        return io.emit("online-users", onlineUsers);
      }
      const userExists = onlineUsers.find((user) => user._id === data._id);
      if (userExists) {
        onlineUsers = onlineUsers.map((user) => {
          if (user._id === userExists._id) {
            // Keep socketID but update with latest DB info like profilePic
            return { ...user, ...data, socketID: user.socketID };
          }
          return user;
        });
        return io.emit("online-users", onlineUsers);
      }
      onlineUsers.push({ ...data, socketID: socket.id });
      io.emit("online-users", onlineUsers);
    });
    socket.on(
      "user-disconnected",
      ({ id, socketId }: { id: string; socketId: string }) => {
        const targetSocketId = socketId || socket.id;
        const allRooms = Array.from(roomMap.keys());
        allRooms.forEach((roomId) => {
          const roomUsers = roomMap.get(roomId)!;
          if (!roomUsers.includes(targetSocketId)) return;
          roomMap.set(
            roomId,
            roomUsers.filter((sId) => sId !== targetSocketId)
          );
          socket.leave(roomId);
          socket.to(roomId).emit("user-left", targetSocketId);
        });

        onlineUsers = onlineUsers.filter(
          (user) => user.socketID !== targetSocketId
        );
        io.emit("online-users", onlineUsers);
      }
    );
    socket.on("message-all", (data: Message) => {
      io.emit("message-to-all", data);
    });
    socket.on("messages-delete", () => {
      io.emit("messages-delete-all");
    });
    socket.on("personal-message", (data: Message) => {
      if (data.sentTo?._id) {
        const user = onlineUsers.find((u) => u._id === data.sentTo?._id);
        if (user?.socketID)
          io.to(user.socketID).emit("personal-message-to-user", data);
      }
    });

    socket.on("new-file-uploaded", () => {
      io.emit("new-file-uploaded-all");
    });

    socket.on("new-user-registered", () => {
      io.emit("new-user-registered-all");
    });

    socket.on("background", (data: BackgroundType) => {
      socket.broadcast.emit("set-background", data);
    });
    socket.on("background-private", (data: BackgroundType) => {
      socket.broadcast.emit("set-private-background", data);
    });

    socket.on("music", (music: string) => {
      socket.broadcast.emit("set-music", music);
    });

    socket.on("private-music", (music: string) => {
      socket.broadcast.emit("private-music-set", music);
    });

    socket.on("private-messages-delete", (email?: string) => {
      const user = onlineUsers.find((u) => u.email === email);
      if (user?.socketID)
        io.to(user.socketID).emit("all-private-messages-delete");
    });

    socket.on("message-update", (data: Message) => {
      socket.broadcast.emit("message-update-all", data);
    });

    socket.on(
      "add-friend",
      (data: { user: UserType; friend: UserWithSocketID }) => {
        io.to(data.friend.socketID).emit("friend", data.user);
        socket.broadcast.emit("friend-added");
      }
    );
    socket.on(
      "remove-friend",
      (data: { user: UserType; friend: UserWithSocketID }) => {
        const user = onlineUsers.find((u) => u?._id === data.friend?._id);
        if (user?.socketID)
          io.to(user.socketID).emit("removefriend", data.user);
      }
    );

    socket.on("new-backgroun-music-upload", () => {
      io.emit("new-bacground-music");
    });

    socket.on("chat-button", (data: DisableButton) => {
      io.emit("chat-button-disabled", data);
    });

    socket.on("new-default-profile", () => {
      io.emit("new-default-profile-all");
    });

    socket.on("user-updated", (data: UserType) => {
      onlineUsers = onlineUsers.map((user) => {
        if (user.socketID === data.socketID || user._id === data._id) {
          return {
            ...user,
            ...data,
          };
        }
        return user;
      });
      io.emit("online-users", onlineUsers);
    });

    socket.on("all-users", (roomId: string) => {
      const roomUsers = roomMap.get(roomId)!;
      io.to(socket.id).emit(
        "all-users",
        roomUsers?.filter((id) => id !== socket.id)
      );
    });
    socket.on("join-room", (roomId: string) => {
      const roomExists = roomMap.get(roomId);
      if (!roomExists) roomMap.set(roomId, []);
      const roomUsers = roomMap.get(roomId)!;
      if (!roomUsers.includes(socket.id)) {
        roomUsers.push(socket.id);
        socket.join(roomId);
      }
      console.log({ room: roomId, users: roomUsers });

      socket.on(
        "seding-offer",
        ({
          offer,
          sendTo,
        }: {
          offer: RTCSessionDescriptionInit;
          sendTo: string;
        }) => {
          io.to(sendTo).emit("offer-received", { offer, sentBy: socket.id });
        }
      );
      socket.on(
        "sending-answer",
        ({
          answer,
          sentTo,
        }: {
          answer: RTCSessionDescriptionInit;
          sentTo: string;
        }) => {
          io.to(sentTo).emit("answer-received", socket.id, answer);
        }
      );
      socket.on(
        "ice-candiate",
        (iceCandidate: RTCIceCandidate | null, sentTo: string) => {
          io.to(sentTo).emit("ice-candidate", iceCandidate, socket.id);
        }
      );
      socket.on("user-left", (roomId: string) => {
        console.log("User Left 2", socket.id);
        const room = roomMap.get(roomId);
        if (!room) return;
        const roomUsers = roomMap.get(roomId)!;
        roomMap.set(
          roomId,
          roomUsers.filter((id) => id !== socket.id)
        );
        console.log({
          room,
          users: roomUsers.filter((id) => id !== socket.id),
        });
        socket.leave(roomId);
        socket.to(roomId).emit("user-left", socket.id);
      });
    });

    socket.on("invite", (roomId: string, sendTo: string) => {
      const room = roomMap.get(roomId);
      if (!room) roomMap.set(roomId, []);
      const roomUser = roomMap.get(roomId)!;
      if (!roomUser.includes(socket.id)) {
        roomUser.push(socket.id);
        socket.join(roomId);
      }
      const caller = onlineUsers.find((u) => u.socketID === socket.id);
      const user = onlineUsers.find((u) => u.email === sendTo);
      if (user?.socketID) {
        io.to(user.socketID).emit("invite", roomId, caller);
      }
    });

    socket.on("user-deleted", (user: UserType) => {
      onlineUsers = onlineUsers.filter((u) => u._id !== user._id);
      io.emit("online-users", onlineUsers);
      io.emit("new-user-registered-all");
      io.emit("user-deleted-all", user);
    });
    socket.on("background-audio-deleted", (type: "public" | "private") => {
      if (type === "public") io.emit("background-audio-deleted-public");
      else io.to(socket.id).emit("background-audio-deleted-private");
    });

    socket.on(
      "disable",
      ({ path, disabled }: { path: string; disabled: boolean }) => {
        io.emit("disable", path, disabled);
      }
    );

    socket.on("disconnect", () => {
      const allRooms = Array.from(roomMap.keys());
      console.log({ allRooms });
      allRooms.forEach((roomId) => {
        const roomUsers = roomMap.get(roomId)!;
        if (!roomUsers.includes(socket.id)) return;
        const users = roomUsers.filter((id) => id !== socket.id);
        roomMap.set(roomId, users);
        if (!users.length) roomMap.delete(roomId);
        socket.leave(roomId);
        console.log({ userLeft: roomUsers.filter((id) => id !== socket.id) });
        socket.to(roomId).emit("user-left", socket.id);
      });

      // Crucial: remove from onlineUsers if the socket drops connection abruptly
      onlineUsers = onlineUsers.filter((u) => u.socketID !== socket.id);
      io.emit("online-users", onlineUsers);
    });
  });
}
