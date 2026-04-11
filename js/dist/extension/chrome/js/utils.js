import { MESSAGES } from "./messages.js";
import { SIDEPANEL_ELEMENT_IDS } from "./constants.js";

export function validTabUrl(tab) {
  if (!tab || !tab.url || (typeof tab.id === "number" && tab.id < 0)) return false;
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) return false;
  return true;
}

export function handleInvalidUrl(selectedTextEl) {
  clearOutputUi();
  showPrompt(selectedTextEl, MESSAGES.errors.invalidTab);
}

export function setHTML(el, html) {
  while (el.firstChild) el.removeChild(el.firstChild);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  Array.from(doc.body.childNodes).forEach((node) => el.appendChild(node.cloneNode(true)));
}

export function showLoading(el, message = MESSAGES.feedback.loading) {
  setHTML(el, `<div class="loading"><em>${message}</em></div>`);
}

export function showPrompt(el, message) {
  setHTML(el, `<div class="prompt"><em>${message}</em></div>`);
}

export function showError(el, message) {
  setHTML(el, `<div class="error" role="alert">${message}</div>`);
}

export function clearOutputUi() {
  const el = document.getElementById(SIDEPANEL_ELEMENT_IDS.outputSection);
  if (el) setHTML(el, "");
}
