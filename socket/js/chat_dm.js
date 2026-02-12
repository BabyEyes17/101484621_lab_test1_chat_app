import { elements } from "./elements.js";
import { state } from "./state.js";
import { addBubble, clearMessagesPanel, setComposerPlaceholder, logEvent } from "./ui.js";



const normalize = (value) => (value || "").trim().toLowerCase();



const sameUser = (a, b) => {

  return normalize(a) === normalize(b);
};



const getOtherUser = (from_user, to_user) => {

  return sameUser(from_user, state.currentUser.username) ? to_user : from_user;
};



export const cacheDmMessage = (doc) => {

  if (!doc) return;

  const otherUser = getOtherUser(doc.from_user, doc.to_user);

  if (!otherUser) return;

  if (!state.dmCache) state.dmCache = new Map();

  if (!state.dmCache.has(otherUser)) {

    state.dmCache.set(otherUser, []);
  }

  state.dmCache.get(otherUser).push(doc);
};



export const renderDmThread = (username) => {

  clearMessagesPanel();

  if (!state.dmCache || !username) {

    setComposerPlaceholder();
    return;
  }

  const threadKey = [...state.dmCache.keys()].find((k) => sameUser(k, username));

  if (!threadKey) {

    setComposerPlaceholder();
    return;
  }

  const thread = state.dmCache.get(threadKey);

  if (!thread || thread.length === 0) {

    setComposerPlaceholder();
    return;
  }

  for (const m of thread) {

    const side = sameUser(m.from_user, state.currentUser.username) ? "me" : "other";

    addBubble(side, `${m.from_user}: ${m.message}`);
  }

  setComposerPlaceholder();
};



export const openDmChat = (username) => {

  if (!username) return;

  state.activeChat = { type: "dm", id: username };

  if (elements.chatTitleEl) elements.chatTitleEl.textContent = `DM: ${username}`;

  renderDmThread(username);

  if (state.clientIO) {

    state.clientIO.emit("dm-history", { with_user: username });
  }
};



export const renderDmRecents = () => {

  if (!elements.dmList) return;

  elements.dmList.innerHTML = "";

  if (!state.dmRecents || state.dmRecents.size === 0) {

    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = "No chats yet.";
    elements.dmList.appendChild(empty);
    return;
  }

  for (const username of state.dmRecents.keys()) {

    const btn = document.createElement("button");
    btn.className = "list-item";
    btn.textContent = username;

    btn.onclick = () => {

      openDmChat(username);
    };

    elements.dmList.appendChild(btn);
  }
};



export const addDmRecent = (username) => {

  if (!username) return;

  if (!state.dmRecents) state.dmRecents = new Map();

  const existingKey = [...state.dmRecents.keys()].find((k) => sameUser(k, username));

  if (existingKey) {

    state.dmRecents.delete(existingKey);
  }

  state.dmRecents.set(username, true);

  renderDmRecents();
};



export const addDmChat = () => {

  const toEl = elements.dmToInput || document.getElementById("dm-to");
  const username = toEl ? toEl.value.trim() : "";

  if (!username) {

    logEvent("ON CLIENT - DM - ERROR: Enter a username to add.");
    return;
  }

  addDmRecent(username);

  openDmChat(username);

  toEl.value = "";
};
