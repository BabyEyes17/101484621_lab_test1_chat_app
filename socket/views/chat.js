const clientIO = io();

const logsDiv = document.getElementById("event-log");
const clientIdEl = document.getElementById("client-id");

const messagesDiv = document.getElementById("messages");
const typingDiv = document.getElementById("typing-indicator");
const chatTitleEl = document.getElementById("chat-title");



const logEvent = (message) => {
    
    if (!logsDiv) return;

    const logEntry = document.createElement("p");
    logEntry.classList.add("log-entry");
    logEntry.textContent = message;

    logsDiv.appendChild(logEntry);
    logsDiv.scrollTop = logsDiv.scrollHeight;
};



const addBubble = (side, text) => {
    
    if (!messagesDiv) return;

    const empty = messagesDiv.querySelector(".empty");
    if (empty) empty.remove();

    const bubble = document.createElement("div");
    bubble.className = `bubble ${side}`;
    bubble.textContent = text;

    messagesDiv.appendChild(bubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};



let currentUser = null;

try {
    
    currentUser = JSON.parse(localStorage.getItem("user"));
} catch {
    
    currentUser = null;
}

if (!currentUser || !currentUser.username) {
    
    window.location.href = "/";
}



let currentRoom = null;

const getSelectedRoom = () => {
    
    const el = document.getElementById("room-select");
    return (el && el.value) ? el.value : "devops";
};



clientIO.on("connect", () => {
    
    logEvent(`✅ Connected. Socket ID: ${clientIO.id}`);

    if (clientIdEl) clientIdEl.textContent = `Client ID - ${clientIO.id}`;

    clientIO.emit("register-user", currentUser.username);
    logEvent(`✅ Registered user: ${currentUser.username}`);
});



clientIO.on("connect_error", (err) => {
    
    logEvent(`❌ Connection error: ${err.message}`);
});



const sendPing = () => {
    
    logEvent("Ping button clicked");

    clientIO.emit("ping", "Hello from Client");
    logEvent("ON CLIENT - PING - SENT: Hello from Client");
};



clientIO.on("pong-ack", (data) => {
    
    logEvent(`ON CLIENT - PONG - RECEIVED: ${data}`);
});



const joinRoom = () => {
    
    const room = getSelectedRoom();

    if (currentRoom) {
        
        clientIO.emit("leave-room");
        logEvent(`ON CLIENT - LEAVE-ROOM - SENT (auto): ${currentRoom}`);
    }

    currentRoom = room;

    if (chatTitleEl) chatTitleEl.textContent = `Room: ${room}`;

    clientIO.emit("join-room", { room, username: currentUser.username });
    logEvent(`ON CLIENT - JOIN-ROOM - SENT: ${room}`);
};



const leaveRoom = () => {
    
    if (!currentRoom) {
        
        logEvent("ON CLIENT - LEAVE-ROOM - ERROR: Not in a room.");
        return;
    }

    clientIO.emit("leave-room");
    logEvent(`ON CLIENT - LEAVE-ROOM - SENT: ${currentRoom}`);

    currentRoom = null;

    if (chatTitleEl) chatTitleEl.textContent = "Room: (none)";
};



clientIO.on("room-system", (msg) => {
    
    logEvent(`SYSTEM: ${msg}`);
    addBubble("other", `SYSTEM: ${msg}`);
});



const sendRoomMessage = () => {
    
    const input = document.getElementById("message-input");
    const message = input ? input.value : "";

    if (!currentRoom) {
        
        logEvent("ON CLIENT - ROOM-MESSAGE - ERROR: Join a room first.");
        return;
    }

    if (!message.trim()) {
        
        logEvent("ON CLIENT - ROOM-MESSAGE - ERROR: Message is empty.");
        return;
    }

    clientIO.emit("room-message", { message });

    logEvent(`ON CLIENT - ROOM-MESSAGE - SENT (${currentRoom}): ${message}`);
    addBubble("me", `${currentUser.username}: ${message}`);

    input.value = "";
};



clientIO.on("room-message", (data) => {
    
    logEvent(`ROOM ${data.room} | ${data.from_user}: ${data.message}`);

    const side = (data.from_user === currentUser.username) ? "me" : "other";
    addBubble(side, `${data.from_user}: ${data.message}`);
});



const sendPrivateMessage = () => {
    
    const toEl = document.getElementById("dm-to");
    const msgEl = document.getElementById("dm-message");

    const to_user = toEl ? toEl.value.trim() : "";
    const message = msgEl ? msgEl.value : "";

    if (!to_user) {
        
        logEvent("ON CLIENT - DM - ERROR: Enter a username to message.");
        return;
    }

    if (!message.trim()) {
        
        logEvent("ON CLIENT - DM - ERROR: Message is empty.");
        return;
    }

    clientIO.emit("private-message", { to_user, message });

    logEvent(`ON CLIENT - DM - SENT to ${to_user}: ${message}`);
    addBubble("me", `DM to ${to_user}: ${message}`);

    msgEl.value = "";
};



clientIO.on("private-message", (data) => {
    
    const direction = (data.from_user === currentUser.username) ? "You →" : `${data.from_user} →`;
    logEvent(`DM ${direction} ${data.to_user}: ${data.message}`);

    const side = (data.from_user === currentUser.username) ? "me" : "other";
    addBubble(side, `DM ${data.from_user} → ${data.to_user}: ${data.message}`);
});



let typingTimer = null;

const emitTyping = (isTyping) => {
    
    const toEl = document.getElementById("dm-to");
    const to_user = toEl ? toEl.value.trim() : "";

    if (!to_user) return;

    clientIO.emit("typing", { to_user, isTyping });
};



const onDmTyping = () => {
    
    emitTyping(true);

    if (typingTimer) clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {
        
        emitTyping(false);
    }, 700);
};



clientIO.on("typing", ({ from_user, isTyping }) => {
    
    if (!typingDiv) return;

    if (isTyping) {
        
        typingDiv.style.display = "block";
        typingDiv.textContent = `${from_user} is typing…`;
    } else {
        
        typingDiv.style.display = "none";
        typingDiv.textContent = "";
    }
});



const disconnectServer = () => {
    
    logEvent("Disconnect button clicked");

    clientIO.disconnect();

    logEvent("ON CLIENT - DISCONNECT - SENT");
};

function logout() {
    
    localStorage.removeItem("user");
    window.location.href = "/";
}



window.sendPing = sendPing;

window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;

window.sendRoomMessage = sendRoomMessage;

window.sendPrivateMessage = sendPrivateMessage;
window.onDmTyping = onDmTyping;

window.disconnectServer = disconnectServer;
window.logout = logout;
