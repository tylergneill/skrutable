import { MESSAGES } from "../messages.js";
import { FEATURE_TABS, STORAGE_KEYS, SIDEPANEL_ELEMENT_IDS } from "../constants.js";
import { setHTML, showLoading, showPrompt, showError, clearOutputUi } from "../utils.js";
import { getSelectedTextFromPage } from "./text-selector.js";
import { loadOptions } from "./options-handler.js";

/**
 * Run the selected skrutable feature on the given text and render output.
 */
export async function runFeature(text) {
  const outputEl = document.getElementById(SIDEPANEL_ELEMENT_IDS.outputSection);
  const items = await loadOptions();
  const feature = items[STORAGE_KEYS.featureTab];

  showLoading(outputEl);

  try {
    let result;

    if (feature === FEATURE_TABS.transliterate) {
      const T = new Skrutable.Transliterator(
        items[STORAGE_KEYS.fromScheme] === "AUTO" ? null : items[STORAGE_KEYS.fromScheme],
        items[STORAGE_KEYS.toScheme]
      );
      result = T.transliterate(
        text,
        items[STORAGE_KEYS.fromScheme] === "AUTO" ? "AUTO" : null,
        null,
        items[STORAGE_KEYS.avoidViramaIndic],
        items[STORAGE_KEYS.avoidViramaNonIndic],
        items[STORAGE_KEYS.preserveAnunasika]
      );
      setHTML(outputEl, `<div class="output-text">${escapeHtml(result)}</div>`);

    } else if (feature === FEATURE_TABS.scan) {
      const S = new Skrutable.Scanner();
      const fromScheme = items[STORAGE_KEYS.fromScheme] === "AUTO" ? null : items[STORAGE_KEYS.fromScheme];
      const verse = S.scan(text, fromScheme);
      const summary = verse.summarize(
        items[STORAGE_KEYS.showWeights],
        items[STORAGE_KEYS.showMorae],
        items[STORAGE_KEYS.showGaRas],
        items[STORAGE_KEYS.showAlignment],
        true
      );
      setHTML(outputEl, `<pre class="output-pre">${escapeHtml(summary)}</pre>`);

    } else if (feature === FEATURE_TABS.identify) {
      const MI = new Skrutable.MeterIdentifier();
      const fromScheme = items[STORAGE_KEYS.fromScheme] === "AUTO" ? null : items[STORAGE_KEYS.fromScheme];
      const verse = MI.identify_meter(text, items[STORAGE_KEYS.resplitOption], false, fromScheme);
      const summary = verse.summarize(true, true, true, true, true);
      setHTML(outputEl, `<pre class="output-pre">${escapeHtml(summary)}</pre>`);

    } else if (feature === FEATURE_TABS.split) {
      showLoading(outputEl, "Splitting (requires network)...");
      const Spl = new Skrutable.Splitter();
      const fromScheme = items[STORAGE_KEYS.fromScheme] === "AUTO" ? null : items[STORAGE_KEYS.fromScheme];
      result = await Spl.split(
        text,
        fromScheme,
        items[STORAGE_KEYS.toScheme],
        items[STORAGE_KEYS.splitterModel],
        items[STORAGE_KEYS.preserveCompoundHyphens],
        items[STORAGE_KEYS.preservePunctuation]
      );
      setHTML(outputEl, `<div class="output-text">${escapeHtml(result)}</div>`);
    }
  } catch (e) {
    showError(outputEl, `${MESSAGES.errors.processing} ${e.message}`);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Full panel update: get selected text from page, then run feature.
 */
export async function updatePanel(elements, currentTab, selectionText = null, selectionError = false) {
  const { selectedTextPreviewEl, selectedTextEl } = elements;

  clearOutputUi();

  let selectedTextResult, selectError;

  if (selectionText) {
    selectedTextResult = selectionText;
    selectError = null;
  } else if (selectionError) {
    selectedTextResult = MESSAGES.prompts.selectText;
    selectError = new Error(MESSAGES.errors.cannotAccessContent);
  } else {
    const { selectedText, error } = await getSelectedTextFromPage(currentTab.id);
    selectedTextResult = selectedText;
    selectError = error;
  }

  if (selectError) {
    showError(selectedTextPreviewEl, selectError.message);
    showError(selectedTextEl, selectError.message);
    return;
  }

  if (selectedTextResult === MESSAGES.prompts.selectText) {
    showPrompt(selectedTextPreviewEl, selectedTextResult);
    showPrompt(selectedTextEl, selectedTextResult);
    return;
  }

  setHTML(selectedTextEl, escapeHtml(selectedTextResult));
  setHTML(selectedTextPreviewEl, escapeHtml(selectedTextResult.substring(0, 220)));

  await runFeature(selectedTextResult);
}
