import { elements } from "./elements.js";
import { state } from "./state.js";
import { logEvent, addBubble } from "./ui.js";
import { addDmRecent, cacheDmMessage, renderDmThread } from "./chat_dm.js";

export const bindSocketEvents = () => {
  state.clientIO.on("connect", () => {
    logEvent(`✅ Connected. Socket ID: ${state.clientIO.id}`);

    if (elements.clientIdEl) elements.clientIdEl.textContent = `Client ID - ${state.clientIO.id}`;

    state.clientIO.emit("register-user", state.currentUser.username);
    logEvent(`✅ Registered user: ${state.currentUser.username}`);
  });

  state.clientIO.on("connect_error", (err) => {
    logEvent(`❌ Connection error: ${err.message}`);
  });

  state.clientIO.on("pong-ack", (data) => {
    logEvent(`ON CLIENT - PONG - RECEIVED: ${data}`);
  });

  state.clientIO.on("room-system", (msg) => {
    logEvent(`SYSTEM: ${msg}`);
    addBubble("other", `SYSTEM: ${msg}`);
  });

  state.clientIO.on("room-message", (data) => {
    logEvent(`ROOM ${data.room} | ${data.from_user}: ${data.message}`);

    if (!state.activeChat || state.activeChat.type !== "room") return;
    if (state.activeChat.id !== data.room) return;

    const side = (data.from_user === state.currentUser.username) ? "me" : "other";
    addBubble(side, `${data.from_user}: ${data.message}`);
  });

  state.clientIO.on("room-history", ({ room, messages }) => {
    if (elements.messagesDiv) elements.messagesDiv.innerHTML = "";

    if (elements.chatTitleEl) elements.chatTitleEl.textContent = `Room: ${room}`;

    if (!messages || messages.length === 0) {
      if (elements.messagesDiv) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No previous messages in this room yet.";
        elements.messagesDiv.appendChild(empty);
      }
      return;
    }

    for (const m of messages) {
      const side = (m.from_user === state.currentUser.username) ? "me" : "other";
      addBubble(side, `${m.from_user}: ${m.message}`);
    }
  });

state.clientIO.on("dm-history", ({ with_user, messages }) => {

  if (!with_user) return;

  if (!state.dmCache) state.dmCache = new Map();

  state.dmCache.set(with_user, []);

  for (const m of (messages || [])) {

    cacheDmMessage(m);
  }

  addDmRecent(with_user);

  if (state.activeChat && state.activeChat.type === "dm" && state.activeChat.id === with_user) {

    renderDmThread(with_user);
  }
});



  state.clientIO.on("private-message", (doc) => {

    const otherUser = (doc.from_user === state.currentUser.username) ? doc.to_user : doc.from_user;

    addDmRecent(otherUser);

    cacheDmMessage(doc);



    logEvent(`DM ${doc.from_user} → ${doc.to_user}: ${doc.message}`);

    if (!state.activeChat || state.activeChat.type !== "dm") return;

    if (state.activeChat.id !== otherUser) return;



    const side = (doc.from_user === state.currentUser.username) ? "me" : "other";

    addBubble(side, `${doc.from_user}: ${doc.message}`);
  });

  state.clientIO.on("typing", ({ from_user, isTyping }) => {
    if (!elements.typingDiv) return;

    if (!state.activeChat || state.activeChat.type !== "dm") return;
    if (state.activeChat.id !== from_user) return;

    if (isTyping) {
      elements.typingDiv.style.display = "block";
      elements.typingDiv.textContent = `${from_user} is typing…`;
    } else {
      elements.typingDiv.style.display = "none";
      elements.typingDiv.textContent = "";
    }
  });
};
