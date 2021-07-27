const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { resizeImg } = require("./utils/resizeImg");
const { extractUsers } = require("./utils/extractUsers.js");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
// const { AsyncResource } = require("async_hooks");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const usernameVsSocket = {};

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Room Admin";

// Run when client connects
io.on("connection", async (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    usernameVsSocket[username] = socket;

    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, `Success! Welcome to ${user.room}!`)
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `Info! ${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  globalUser = getCurrentUser(socket.id);

  // Listen for chatMessage
  socket.on("chatMessage", ({ msg, tag }) => {
    const user = getCurrentUser(socket.id);

    if (tag) {
      const users = extractUsers(tag);

      const notUsers = [];

      // Emit to all tagged user
      for (let i = 0; i < users.length; i++) {
        const tempUser = users[i];
        if (usernameVsSocket[tempUser] && tempUser !== users.username) {
          usernameVsSocket[tempUser].emit(
            "message",
            formatMessage(user.username, msg)
          );
        } else {
          notUsers.push(tempUser);
        }
      }

      // Emmit to itself
      if (notUsers.length !== users.length)
        socket.emit("message", formatMessage(user.username, msg));

      // Inform about disconnected user
      if (notUsers.length) {
        const verb = notUsers.length == 1 ? "is" : "are";
        socket.emit(
          "message",
          formatMessage(
            botName,
            `Error! ${notUsers.join()} ${verb} not connected!`
          )
        );
      }
    } else {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  socket.on("photoMessage", async (data) => {
    const user = getCurrentUser(socket.id);
    const { photo, compressed } = await resizeImg(data.photo);

    // const photo = data.photo;
    // const compressed = false;

    if (compressed)
      socket.emit(
        "message",
        formatMessage(
          botName,
          "Warning! Image is compressed for better performance."
        )
      );

    if (data.tag) {
      const users = extractUsers(data.tag);
      const notUsers = [];

      // Emit to all tagged users
      for (let i = 0; i < users.length; i++) {
        const tempUser = users[i];
        // console.log(tempUser);
        if (usernameVsSocket[tempUser] && tempUser !== users.username) {
          usernameVsSocket[tempUser].emit(
            "photo",

            {
              photo,
              msg: formatMessage(user.username, data.msg),
            }
          );
        } else {
          notUsers.push(tempUser);
        }
      }

      // Emmit to itself
      if (notUsers.length !== users.length)
        socket.emit("photo", {
          photo,
          msg: formatMessage(user.username, data.msg),
        });

      // Inform about disconnected users
      if (notUsers.length) {
        // console.log(notUsers);
        const verb = notUsers.length == 1 ? "is" : "are";
        socket.emit(
          "message",
          formatMessage(
            botName,
            `Error! ${notUsers.join()} ${verb} not connected!`
          )
        );
      }
    } else {
      io.to(user.room).emit("photo", {
        photo,
        msg: formatMessage(user.username, data.msg),
      });
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      delete usernameVsSocket[user.username];
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `Warning! ${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 80;

server.listen(PORT, "0.0.0.0", () => {
  console.clear();
  console.log(`Server running on port ${PORT}`);
});
