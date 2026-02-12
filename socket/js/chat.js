import { elements } from "./elements.js";
import { state } from "./state.js";
import { loadUserOrRedirect } from "./authentication.js";
import { setComposerPlaceholder, clearMessagesPanel } from "./ui.js";
import { bindSocketEvents } from "./socket.js";
import { selectRoom, leaveRoom } from "./chat_rooms.js";
import { addDmChat } from "./chat_dm.js";
import { sendMessage, onTyping, sendPing, disconnectServer, logout } from "./actions.js";

state.clientIO = io();

loadUserOrRedirect();
clearMessagesPanel();
setComposerPlaceholder();

bindSocketEvents();

if (elements.composerInput) {

  elements.composerInput.addEventListener("blur", () => {

    if (!state.activeChat || state.activeChat.type !== "dm") return;

    state.clientIO.emit("typing", {
      to_user: state.activeChat.id,
      isTyping: false
    });
  });
}

window.selectRoom = selectRoom;
window.addDmChat = addDmChat;
window.sendMessage = sendMessage;
window.onTyping = onTyping;
window.leaveRoom = leaveRoom;
window.sendPing = sendPing;
window.disconnectServer = disconnectServer;
window.logout = logout;
