import { elements } from "./elements.js";
import { state } from "./state.js";

export const loadUserOrRedirect = () => {
  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem("user"));
  } catch {
    user = null;
  }

  state.currentUser = user;

  if (!state.currentUser || !state.currentUser.username) {
    window.location.href = "/";
    return;
  }

  if (elements.loggedInEl) {
    const name = state.currentUser.username || "Unknown";
    elements.loggedInEl.innerHTML = `Logged in as: <b>${name}</b>`;
  }
};
