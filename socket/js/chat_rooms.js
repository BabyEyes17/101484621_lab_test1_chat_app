import { elements } from "./elements.js";
import { state } from "./state.js";
import { clearMessagesPanel, setComposerPlaceholder, logEvent } from "./ui.js";

export const setActiveRoomButton = (room) => {
  const list = document.getElementById("room-list");
  if (!list) return;

  for (const btn of list.querySelectorAll(".list-item")) {
    const isActive = btn.textContent.trim() === room;
    btn.classList.toggle("active", isActive);
  }
};

export const joinRoom = (room) => {
  if (!room) return;

  if (state.currentRoom) {
    state.clientIO.emit("leave-room");
    logEvent(`ON CLIENT - LEAVE-ROOM - SENT (auto): ${state.currentRoom}`);
  }

  state.currentRoom = room;

  state.clientIO.emit("join-room", { room, username: state.currentUser.username });
  logEvent(`ON CLIENT - JOIN-ROOM - SENT: ${room}`);
};

export const selectRoom = (room) => {
  state.activeChat = { type: "room", id: room };

  setActiveRoomButton(room);

  if (elements.chatTitleEl) elements.chatTitleEl.textContent = `Room: ${room}`;

  clearMessagesPanel();
  setComposerPlaceholder();

  joinRoom(room);
};

export const leaveRoom = () => {
  if (!state.currentRoom) {
    logEvent("ON CLIENT - LEAVE-ROOM - ERROR: Not in a room.");
    return;
  }

  state.clientIO.emit("leave-room");
  logEvent(`ON CLIENT - LEAVE-ROOM - SENT: ${state.currentRoom}`);

  // if leaving the room you’re currently viewing: reset to none
  if (state.activeChat && state.activeChat.type === "room" && state.activeChat.id === state.currentRoom) {
    state.activeChat = null;
    clearMessagesPanel();
    setComposerPlaceholder();

    if (elements.chatTitleEl) elements.chatTitleEl.textContent = "Room: (none)";
  }

  state.currentRoom = null;
};
