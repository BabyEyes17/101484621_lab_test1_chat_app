// Lab Test 01
// Jayden Lewis - 101484621

const express = require('express');
const path = require('path');
const iosocket = require('socket.io');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const SERVER_PORT = process.env.PORT || 3000;
const app = express();

// Predefined rooms
const ROOMS = ["devops", "cloud computing", "covid19", "sports", "nodeJS"];

app.use(express.static(path.join(__dirname, 'socket/views')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Connecting to MongoDB Atlas
const DB_NAME = "lab_test_db"
const DB_USER_NAME = 'jayden-lewis'
const DB_PASSWORD = 'extrafloofy'
const CLUSTER_ID = 'njwrjmg'
const DB_CONNECTION = `mongodb+srv://${DB_USER_NAME}:${DB_PASSWORD}@comp3123-cluster.${CLUSTER_ID}.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`

async function connectToMongoDB(connectionString = DB_CONNECTION) {
    
    await mongoose.connect(connectionString);
}

const appServer = app.listen(SERVER_PORT, async () => {
    
    console.log(`Server running on http://localhost:${SERVER_PORT}/`);

    try {
        
        await connectToMongoDB(DB_CONNECTION);
        console.log("Connected to MongoDB");
    } 
    
    catch (error) {
        
        console.error("Error connecting to MongoDB:", error);
    }
});

const ioServer = iosocket(appServer);



mongoose.connection.on("connected", () => {
    
    console.log("Mongoose connected");
});

mongoose.connection.on("error", (err) => {
    
    console.log("Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
    
    console.log("Mongoose disconnected");
});



// Sign up page
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "socket/views/signup.html"));
});

// Login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "socket/views/login.html"));
});

// Chat page
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "socket/views/chat.html"));
});



// ✅ API: Sign up (creates user in MongoDB)
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing username, email, or password." });
    }

    // check duplicates
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: "Username or email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed
    });

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error." });
  }
});



// ✅ API: Login (verifies password)
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Return something the client can store in localStorage
    return res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error." });
  }
});



// ✅ track online users by username -> socket.id
const onlineUsers = new Map();

ioServer.on('connection', (socket) => {
    
  console.log('New client connected', socket.id);



  // Register user so we can route private messages and typing indicators
  socket.on("register-user", (username) => {
      
    socket.username = username;
    onlineUsers.set(username, socket.id);

    console.log("Online users:", Array.from(onlineUsers.keys()));
  });



  // Optional demo ping
  socket.on('ping', (data) => {
      
    console.log('Ping received from client:', data);
    socket.emit('pong-ack', "Hello from the Server");
    console.log('Pong sent to client');
  });



  // Join a predefined room
  socket.on("join-room", async ({ room, username }) => {
      
    if (!ROOMS.includes(room)) {
        
        console.log(`Join-room rejected (invalid room): ${room}`);
        return;
    }

    socket.username = username;
    onlineUsers.set(username, socket.id);

    // Leave previous room if any
    if (socket.currentRoom) {
        
        socket.leave(socket.currentRoom);
        ioServer.to(socket.currentRoom).emit("room-system", `${socket.username} left ${socket.currentRoom}`);
    }

    socket.currentRoom = room;
    socket.join(room);

    const history = await GroupMessage
        .find({ room })
        .sort({ date_sent: 1 })
        .limit(50);

    socket.emit("room-history", {
        room,
        messages: history
    });

    console.log(`${socket.username} joined room: ${room}`);
    ioServer.to(room).emit("room-system", `${socket.username} joined ${room}`);
  });



  // Leave current room
  socket.on("leave-room", () => {
      
    const room = socket.currentRoom;
    if (!room) return;

    socket.leave(room);

    console.log(`${socket.username} left room: ${room}`);
    ioServer.to(room).emit("room-system", `${socket.username} left ${room}`);

    socket.currentRoom = null;
  });



  // Room message (save to MongoDB + emit to room)
  socket.on("room-message", async ({ message }) => {
      
    try {
        
        const room = socket.currentRoom;

        if (!room) {
            
            console.log("ROOM-MESSAGE rejected: user not in a room");
            return;
        }

        if (!message || !message.trim()) {
            
            console.log("ROOM-MESSAGE rejected: empty message");
            return;
        }

        const doc = await GroupMessage.create({
            from_user: socket.username,
            room,
            message: message.trim()
        });

        console.log("Saved group message:", doc._id);
        ioServer.to(room).emit("room-message", doc);
    } 
    
    catch (err) {
        
        console.log("Failed to save group message:", err);
    }
  });



  // Private message (save to MongoDB + deliver to recipient if online)
  socket.on("private-message", async ({ to_user, message }) => {
      
    try {
        
        if (!to_user || !to_user.trim()) return;
        if (!message || !message.trim()) return;

        const toSocketId = onlineUsers.get(to_user.trim());

        const doc = await PrivateMessage.create({
            from_user: socket.username,
            to_user: to_user.trim(),
            message: message.trim()
        });

        console.log("Saved private message:", doc._id);

        // Send to recipient if they are online
        if (toSocketId) {
            
            ioServer.to(toSocketId).emit("private-message", doc);
        }

        // Echo back to sender so they see it in their own log
        socket.emit("private-message", doc);
    } 
    
    catch (err) {
        
        console.log("Failed to save private message:", err);
    }
  });



  // Typing indicator for 1-to-1 chat
  socket.on("typing", ({ to_user, isTyping }) => {
      
    const toSocketId = onlineUsers.get((to_user || "").trim());
    if (!toSocketId) return;

    ioServer.to(toSocketId).emit("typing", {
      from_user: socket.username,
      isTyping: !!isTyping
    });
  });



  socket.on('disconnect', () => {
      
    console.log('Client disconnected', socket.id);

    if (socket.username) {
        
      onlineUsers.delete(socket.username);
    }

    console.log("Online users:", Array.from(onlineUsers.keys()));
  });
});
