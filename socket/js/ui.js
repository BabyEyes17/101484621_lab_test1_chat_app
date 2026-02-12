import { elements } from "./elements.js";
import { state } from "./state.js";

export const logEvent = (message) => {
  if (!elements.logsDiv) return;

  const logEntry = document.createElement("p");
  logEntry.classList.add("log-entry");
  logEntry.textContent = message;

  elements.logsDiv.appendChild(logEntry);
  elements.logsDiv.scrollTop = elements.logsDiv.scrollHeight;
};

export const addBubble = (side, text) => {
  if (!elements.messagesDiv) return;

  const empty = elements.messagesDiv.querySelector(".empty");
  if (empty) empty.remove();

  const bubble = document.createElement("div");
  bubble.className = `bubble ${side}`;
  bubble.textContent = text;

  elements.messagesDiv.appendChild(bubble);
  elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
};

export const clearMessagesPanel = () => {
  if (!elements.messagesDiv) return;

  elements.messagesDiv.innerHTML = "";

  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = "No messages yet.";
  elements.messagesDiv.appendChild(empty);
};

export const setComposerPlaceholder = () => {
  if (!elements.composerInput) return;

  if (!state.activeChat) {
    elements.composerInput.placeholder = "Select a room or DM to start...";
    elements.composerInput.disabled = true;
    return;
  }

  elements.composerInput.disabled = false;

  if (state.activeChat.type === "room") {
    elements.composerInput.placeholder = `Message #${state.activeChat.id}`;
  } else {
    elements.composerInput.placeholder = `Message @${state.activeChat.id}`;
  }
};
