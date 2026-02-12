import { elements } from "./elements.js";
import { state } from "./state.js";
import { logEvent, clearMessagesPanel, setComposerPlaceholder } from "./ui.js";
import { addDmRecent, cacheDmMessage } from "./chat_dm.js";
import { addBubble } from "./ui.js";



let typingIdleTimer = null;

let isCurrentlyTyping = false;



export const sendPing = () => {

  logEvent("Ping button clicked");

  state.clientIO.emit("ping", "Hello from Client");
  logEvent("ON CLIENT - PING - SENT: Hello from Client");
};



export const sendMessage = () => {

  if (!state.activeChat) {

    logEvent("ON CLIENT - SEND - ERROR: Select a room or DM first.");
    return;
  }

  const text = elements.composerInput ? elements.composerInput.value : "";

  if (!text.trim()) {

    logEvent("ON CLIENT - SEND - ERROR: Message is empty.");
    return;
  }

  if (state.activeChat.type === "room") {

    if (!state.currentRoom || state.currentRoom !== state.activeChat.id) {

      logEvent("ON CLIENT - ROOM - ERROR: Not joined to the selected room.");
      return;
    }

    state.clientIO.emit("room-message", { message: text });
    logEvent(`ON CLIENT - ROOM-MESSAGE - SENT (${state.activeChat.id}): ${text}`);
  }

  if (state.activeChat.type === "dm") {

const to_user = state.activeChat.id.trim();


  const msg = text.trim();

  const localDoc = {
    from_user: state.currentUser.username,
    to_user,
    message: msg
  };

  cacheDmMessage(localDoc);

  addBubble("me", `${localDoc.from_user}: ${localDoc.message}`);

  state.clientIO.emit("private-message", { to_user, message: msg });

  logEvent(`ON CLIENT - DM - SENT to ${to_user}: ${msg}`);

  state.clientIO.emit("typing", { to_user, isTyping: false });

  isCurrentlyTyping = false;

  if (typingIdleTimer) clearTimeout(typingIdleTimer);

  addDmRecent(to_user);
}


  if (elements.composerInput) elements.composerInput.value = "";
};



export const onTyping = () => {

  if (!state.activeChat || state.activeChat.type !== "dm") return;

  const to_user = state.activeChat.id;

  if (!to_user) return;

  if (!isCurrentlyTyping) {

    isCurrentlyTyping = true;

    state.clientIO.emit("typing", { to_user, isTyping: true });
  }

  if (typingIdleTimer) clearTimeout(typingIdleTimer);

  typingIdleTimer = setTimeout(() => {

    isCurrentlyTyping = false;

    state.clientIO.emit("typing", { to_user, isTyping: false });

  }, 1600);
};



export const disconnectServer = () => {

  logEvent("Disconnect button clicked");

  state.clientIO.disconnect();
  logEvent("ON CLIENT - DISCONNECT - SENT");

  state.activeChat = null;
  state.currentRoom = null;

  clearMessagesPanel();
  setComposerPlaceholder();

  if (elements.composerInput) elements.composerInput.value = "";

  if (elements.chatTitleEl) elements.chatTitleEl.textContent = "Room: (none)";

  if (elements.typingDiv) {

    elements.typingDiv.style.display = "none";
    elements.typingDiv.textContent = "";
  }

  const list = document.getElementById("room-list");

  if (list) {

    for (const btn of list.querySelectorAll(".list-item")) {

      btn.classList.remove("active");
    }
  }
};



export function logout() {

  sessionStorage.removeItem("user");
  window.location.href = "/";
}
