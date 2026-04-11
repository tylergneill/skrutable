/**
 * Main entry point for the Skrutable sidepanel
 */
import { ACTIONS, FEATURE_TABS, STORAGE_KEYS, SIDEPANEL_ELEMENT_IDS, FONT_SIZE_KEY, FONT_SIZE_DEFAULT, FONT_SIZE_CSS_VAR, FONT_SIZE_MAP } from "../constants.js";
import { MESSAGES } from "../messages.js";
import { validTabUrl, showError, showPrompt, handleInvalidUrl } from "../utils.js";
import { updatePanel, runFeature } from "./panel-updater.js";
import { populateSelects, restoreOptions, setupOptionListeners } from "./options-handler.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Restore font size immediately to avoid flash
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || FONT_SIZE_DEFAULT;
  document.documentElement.style.setProperty(FONT_SIZE_CSS_VAR, FONT_SIZE_MAP[savedFontSize]);

  const elements = {
    selectedTextPreviewEl: document.getElementById(SIDEPANEL_ELEMENT_IDS.selectedTextPreview),
    selectedTextEl: document.getElementById(SIDEPANEL_ELEMENT_IDS.selectedText),
  };

  // Populate selects and restore saved options
  populateSelects();
  const items = await restoreOptions();

  // Set active feature tab
  setActiveFeatureTab(items[STORAGE_KEYS.featureTab] || FEATURE_TABS.transliterate);

  // Feature tab nav buttons
  document.getElementById(SIDEPANEL_ELEMENT_IDS.featureTabsNav).addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-feature]");
    if (!btn) return;
    const feature = btn.dataset.feature;
    setActiveFeatureTab(feature);
    await browser.storage.sync.set({ [STORAGE_KEYS.featureTab]: feature });
    // Re-run on the current selected text if any
    const selectedText = document.getElementById(SIDEPANEL_ELEMENT_IDS.selectedText).textContent.trim();
    if (selectedText && selectedText !== MESSAGES.prompts.selectText) {
      await runFeature(selectedText);
    }
  });

  // Option changes re-run feature immediately
  setupOptionListeners(async () => {
    const selectedText = document.getElementById(SIDEPANEL_ELEMENT_IDS.selectedText).textContent.trim();
    if (selectedText && selectedText !== MESSAGES.prompts.selectText) {
      await runFeature(selectedText);
    }
  });

  // Refresh button
  document.getElementById(SIDEPANEL_ELEMENT_IDS.refreshSelectionBtn).addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const currentTab = tabs[0];
      if (!validTabUrl(currentTab)) {
        handleInvalidUrl(elements.selectedTextEl);
        return;
      }
      updatePanel(elements, currentTab);
    });
  });

  // Messages from background
  browser.runtime.onMessage.addListener(message => {
    if (message.action === ACTIONS.invalidTabPrompt) {
      handleInvalidUrl(elements.selectedTextEl);
      return false;
    }

    if (message.action === ACTIONS.extIconTrigger || message.action === ACTIONS.contextMenuTrigger) {
      if (!message.tabId) {
        showError(elements.selectedTextEl, MESSAGES.errors.noActiveTab);
        return false;
      }
      browser.tabs.get(message.tabId).then(tab => {
        if (!tab || !validTabUrl(tab)) {
          handleInvalidUrl(elements.selectedTextEl);
          return;
        }
        updatePanel(elements, tab, message.selectionText ?? null, message.selectionError ?? false);
      }).catch(error => {
        showError(elements.selectedTextEl, error.message);
      });
    }

    return false;
  });
});

function setActiveFeatureTab(feature) {
  // Update nav button states
  document.querySelectorAll("#feature-tabs-nav button[data-feature]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.feature === feature);
  });
  // Show/hide option panels
  const panels = {
    [FEATURE_TABS.transliterate]: SIDEPANEL_ELEMENT_IDS.transliterateOptions,
    [FEATURE_TABS.scan]: SIDEPANEL_ELEMENT_IDS.scanOptions,
    [FEATURE_TABS.identify]: SIDEPANEL_ELEMENT_IDS.identifyOptions,
    [FEATURE_TABS.split]: SIDEPANEL_ELEMENT_IDS.splitOptions,
  };
  Object.entries(panels).forEach(([f, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = f === feature ? "" : "none";
  });
}
