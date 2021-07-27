// import showAlert from "./alerts";
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log(message);

  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("photo", (data) => {
  outputImage(data);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  console.log(e.target.elements);

  let photoElement = document.getElementById("photo").files;

  // console.log(photoElement.height);

  console.log(e.target.elements.photo);

  console.log(photoElement);

  if (photoElement) {
    console.log("Image included!");
    photoElement = photoElement[0];
  } else {
    console.log("Image not included!");
  }

  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg && !photoElement) {
    return false;
  }

  let tag = document.getElementById("tag").value;

  if (photoElement) {
    let data = {
      msg,
      photo: photoElement,
      tag,
    };

    // console.log(e.target.elements.photo.files[0]);

    socket.emit("photoMessage", data);
  } else {
    // Emit message to server
    socket.emit("chatMessage", { msg, tag });
  }

  const form = document.getElementById("chat-form");
  form.reset();

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
  e.target.elements.files = [];
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");

  if (message.username === "Room Admin") {
    const typeOFAlert = message.text.split("!")[0].toLowerCase();
    // console.log("Hello ", message);
    showAlert(typeOFAlert, message.text);
    return;
  }

  if (message.username === username) div.classList.add("message-user");
  else div.classList.add("message");

  const p = document.createElement("p");
  p.classList.add("meta");

  if (message.username === username) p.innerText = "You";
  else p.innerText = message.username;
  // p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);

  const timeP = document.createElement("p");
  timeP.classList.add("meta");
  timeP.innerHTML += `<span>${message.time}</span>`;

  div.appendChild(timeP);

  if (message.username === username) div.classList.add("userMessage");
  document.querySelector(".chat-messages").appendChild(div);
}

function outputImage(data) {
  const message = data.msg;
  const div = document.createElement("div");

  if (message.username === username) div.classList.add("message-user");
  else div.classList.add("message");

  const p = document.createElement("p");
  p.classList.add("meta");

  if (message.username === username) p.innerText = "You";
  else p.innerText = message.username;
  // p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);

  // Load image
  const arrayBuffer = data.photo;

  console.log(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  const blob = new Blob([bytes.buffer]);

  const imageComponent = document.createElement("img");
  // imageComponent.src =
  //   "data:image/jpeg;base64," + bytes.buffer.toString("base64");
  imageComponent.src = URL.createObjectURL(blob);

  imageComponent.onload = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  div.appendChild(imageComponent);

  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);

  const timeP = document.createElement("p");
  timeP.classList.add("meta");
  timeP.innerHTML += `<span>${message.time}</span>`;

  div.appendChild(timeP);

  if (message.username === username) div.classList.add("userMessage");
  document.querySelector(".chat-messages").appendChild(div);

  // chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});

function showAlert(type, msg) {
  const markup = `<div class="alert alert--${type}" id="alert"><span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>${msg}</div>`;

  var alertMarkup = document.getElementById("alert");

  // console.log(alertMarkup);

  if (alertMarkup) {
    alertMarkup.remove();
  }

  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
}
