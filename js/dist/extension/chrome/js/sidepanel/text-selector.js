import { MESSAGES } from "../messages.js";

export async function getSelectedTextFromPage(tabId) {
  if (!tabId) {
    return { selectedText: MESSAGES.prompts.selectText, error: new Error(MESSAGES.errors.noActiveTab) };
  }

  try {
    const injectionResults = await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
        if (window.getSelection) return window.getSelection().toString().trim();
        throw new Error("getSelection is not available");
      },
    });

    let selectedText = "";
    if (injectionResults && injectionResults.length > 0) {
      for (const frameResult of injectionResults) {
        if (frameResult && frameResult.result && typeof frameResult.result === "string" && frameResult.result.trim()) {
          selectedText = frameResult.result.trim();
          break;
        }
      }
    }

    return { selectedText: selectedText || MESSAGES.prompts.selectText, error: null };
  } catch (error) {
    console.error("Error in getSelectedTextFromPage:", error);
    return { selectedText: MESSAGES.prompts.selectText, error: new Error(MESSAGES.errors.cannotAccessContent) };
  }
}
