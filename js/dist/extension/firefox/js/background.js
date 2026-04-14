import {
  CONTEXT_MENU_TRIGGER_ID,
  CONTEXT_MENU_CONTEXTS,
  ACTIONS,
} from "./constants.js";
import { MESSAGES } from "./messages.js";
import { validTabUrl } from "./utils.js";
import "./vendor/webextension-polyfill.min.js";


async function openAppPanel(tab) {
  if (typeof browser.sidebarAction?.open === "function") {
    try { await browser.sidebarAction.open(); } catch (_) { /* ignore */ }
  }

}

browser.action.onClicked.addListener(async (tab) => {
  await openAppPanel(tab);

  setTimeout(async () => {
    if (!validTabUrl(tab)) {
      browser.runtime.sendMessage({ action: ACTIONS.invalidTabPrompt });
      return;
    }

    let selectionText = "";
    let selectionError = false;
    try {
      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          try {
            return (window.getSelection && window.getSelection().toString().trim()) || "";
          } catch { return ""; }
        },
      });
      if (Array.isArray(results)) {
        for (const { result } of results) {
          if (typeof result === "string" && result.trim()) {
            selectionText = result.trim();
            break;
          }
        }
      }
    } catch (e) {
      selectionError = true;
    }

    const msg = { action: ACTIONS.extIconTrigger, tabId: tab.id };
    if (selectionText) msg.selectionText = selectionText;
    if (selectionError || !selectionText) msg.selectionError = true;
    browser.runtime.sendMessage(msg).catch(() => {});
  }, 400);
});

browser.contextMenus.removeAll().then(() => {
  browser.contextMenus.create({
    id: CONTEXT_MENU_TRIGGER_ID,
    title: MESSAGES.generic.tagline,
    contexts: CONTEXT_MENU_CONTEXTS,
  });
}).catch((error) => {
  console.error("Error removing context menus:", error);
  browser.contextMenus.create({
    id: CONTEXT_MENU_TRIGGER_ID,
    title: MESSAGES.generic.tagline,
    contexts: CONTEXT_MENU_CONTEXTS,
  }).catch((e) => console.error("Error creating context menu:", e));
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_TRIGGER_ID) return;
  openAppPanel(tab);

  const resolveTab = () => {
    if (!tab || typeof tab.id !== "number" || tab.id < 0) {
      return browser.tabs.query({ active: true, currentWindow: true }).then(([active]) => active || tab);
    }
    return Promise.resolve(tab);
  };

  resolveTab().then((currentTab) => {
    if (!validTabUrl(currentTab)) {
      browser.runtime.sendMessage({ action: ACTIONS.invalidTabPrompt });
      return;
    }
    const msg = {
      action: ACTIONS.contextMenuTrigger,
      tabId: currentTab.id,
      selectionText: info.selectionText,
    };
    setTimeout(() => browser.runtime.sendMessage(msg).catch(() => {}), 250);
  });
});
