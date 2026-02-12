const express = require("express");
const path = require("path");
const iosocket = require("socket.io");
const mongoose = require("mongoose");

const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const pagesRoutes = require("./routes/routes");
const authRoutes = require("./routes/authenticated_routes");

const SERVER_PORT = process.env.PORT || 3000;

const ROOMS = ["devops", "cloud computing", "covid19", "sports", "nodeJS"];

const DB_NAME = process.env.DB_NAME || "lab_test_db";
const DB_USER_NAME = process.env.DB_USER_NAME || "jayden-lewis";
const DB_PASSWORD = process.env.DB_PASSWORD || "extrafloofy";
const CLUSTER_ID = process.env.CLUSTER_ID || "njwrjmg";

const DB_CONNECTION =
process.env.DB_CONNECTION ||
`mongodb+srv://${DB_USER_NAME}:${DB_PASSWORD}@comp3123-cluster.${CLUSTER_ID}.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const normalizeKey = (value) => (value || "").trim().toLowerCase();
const normalizeDisplay = (value) => (value || "").trim();



const app = express();



app.use(express.static(path.join(__dirname, "socket/views")));
app.use("/js", express.static(path.join(__dirname, "socket/js")));
app.use("/styles", express.static(path.join(__dirname, "socket/styles")));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(pagesRoutes);
app.use(authRoutes);



async function connectToMongoDB(connectionString = DB_CONNECTION) {
await mongoose.connect(connectionString);
}



mongoose.connection.on("connected", () => {
console.log("Mongoose connected");
});

mongoose.connection.on("error", (err) => {
console.log("Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
console.log("Mongoose disconnected");
});



const appServer = app.listen(SERVER_PORT, async () => {
console.log(`Server running on http://localhost:${SERVER_PORT}/`);

try {
await connectToMongoDB(DB_CONNECTION);
console.log("Connected to MongoDB");
} catch (error) {
console.error("Error connecting to MongoDB:", error);
}
});



const ioServer = iosocket(appServer);

const onlineUsers = new Map();



ioServer.on("connection", (socket) => {
console.log("New client connected", socket.id);



socket.on("register-user", (username) => {
const display = normalizeDisplay(username);
const key = normalizeKey(username);

socket.username = display;
socket.usernameKey = key;

onlineUsers.set(key, socket.id);

console.log("Online users:", Array.from(onlineUsers.keys()));
});




socket.on("ping", (data) => {
console.log("Ping received from client:", data);
socket.emit("pong-ack", "Hello from the Server");
console.log("Pong sent to client");
});



socket.on("join-room", async ({ room, username }) => {
if (!ROOMS.includes(room)) return;

const display = normalizeDisplay(username);
const key = normalizeKey(username);

socket.username = display;
socket.usernameKey = key;

onlineUsers.set(key, socket.id);

if (socket.currentRoom) {
socket.leave(socket.currentRoom);
ioServer.to(socket.currentRoom).emit("room-system", `${socket.username} left ${socket.currentRoom}`);
}

socket.currentRoom = room;
socket.join(room);

const history = await GroupMessage.find({ room }).sort({ date_sent: 1 }).limit(50);

socket.emit("room-history", { room, messages: history });

ioServer.to(room).emit("room-system", `${socket.username} joined ${room}`);
});




socket.on("leave-room", () => {
const room = socket.currentRoom;
if (!room) return;

socket.leave(room);

ioServer.to(room).emit("room-system", `${socket.username} left ${room}`);

socket.currentRoom = null;
});



socket.on("room-message", async ({ message }) => {
try {
const room = socket.currentRoom;
if (!room) return;
if (!message || !message.trim()) return;

const doc = await GroupMessage.create({
from_user: socket.username,
room,
message: message.trim(),
});

ioServer.to(room).emit("room-message", doc);
} catch (err) {}
});



socket.on("private-message", async ({ to_user, message }) => {
try {
const toKey = normalizeKey(to_user);
const toDisplay = normalizeDisplay(to_user);
const msg = (message || "").trim();

if (!toKey) return;
if (!msg) return;

const toSocketId = onlineUsers.get(toKey);

const doc = await PrivateMessage.create({
from_user: socket.username,
to_user: toDisplay,
message: msg,
});

if (toSocketId) {
ioServer.to(toSocketId).emit("private-message", doc);
}
} catch (err) {}
});



socket.on("dm-history", async ({ with_user }) => {
try {
const a = (socket.username || "").trim();
const b = (with_user || "").trim();

if (!a || !b) return;

const messages = await PrivateMessage.find({
$or: [
{ from_user: a, to_user: b },
{ from_user: b, to_user: a }
]
})
.sort({ date_sent: 1 });

socket.emit("dm-history", { with_user: b, messages });
} catch (err) {}
});



socket.on("typing", ({ to_user, isTyping }) => {
const toKey = normalizeKey(to_user);
const toSocketId = onlineUsers.get(toKey);

if (!toSocketId) return;

ioServer.to(toSocketId).emit("typing", {
from_user: socket.username,
isTyping: !!isTyping,
});
});



socket.on("disconnect", () => {
console.log("Client disconnected", socket.id);

if (socket.usernameKey) {
onlineUsers.delete(socket.usernameKey);
}

console.log("Online users:", Array.from(onlineUsers.keys()));
});

});
