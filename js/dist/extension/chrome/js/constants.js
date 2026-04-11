/**
 * Constants for the Skrutable extension
 */

// WEBEXTENSIONS API & RELATED
export const CONTEXT_MENU_TRIGGER_ID = "skrutable-context-menu";
export const CONTEXT_MENU_CONTEXTS = ["selection"];

export const STORAGE_KEYS = {
  featureTab: "featureTab",
  fromScheme: "fromScheme",
  toScheme: "toScheme",
  resplitOption: "resplitOption",
  preserveAnunasika: "preserveAnunasika",
  avoidViramaIndic: "avoidViramaIndic",
  avoidViramaNonIndic: "avoidViramaNonIndic",
  splitterModel: "splitterModel",
  preserveCompoundHyphens: "preserveCompoundHyphens",
  preservePunctuation: "preservePunctuation",
  fontSize: "fontSize",
  showWeights: "showWeights",
  showMorae: "showMorae",
  showGaRas: "showGaRas",
  showAlignment: "showAlignment",
};

export const ACTIONS = {
  extIconTrigger: "extIconTrigger",
  contextMenuTrigger: "contextMenuTrigger",
  invalidTabPrompt: "invalidTabPrompt",
  processText: "processText",
};

export const FEATURE_TABS = {
  transliterate: "transliterate",
  scan: "scan",
  identify: "identify",
  split: "split",
};

export const SCHEMES = ["AUTO", "IAST", "SLP", "DEV", "HK", "ITRANS", "VH", "WX", "BENGALI", "GUJARATI"];
export const SCHEMES_OUTPUT = ["IAST", "SLP", "DEV", "HK", "ITRANS", "VH", "WX", "BENGALI", "GUJARATI"];
export const RESPLIT_OPTIONS = ["resplit_max", "resplit_lite", "none", "single_pAda"];
export const SPLITTER_MODELS = ["dharmamitra_2024_sept", "splitter_2018"];

export const SIDEPANEL_ELEMENT_IDS = {
  extOptionsBtn: "ext-options-btn",
  refreshSelectionBtn: "refresh-selection",
  selectedTextPreview: "selected-text-preview",
  selectedText: "selected-text",
  content: "content",
  featureTabsNav: "feature-tabs-nav",
  outputSection: "output-section",
  // Feature option panels
  transliterateOptions: "transliterate-options",
  scanOptions: "scan-options",
  identifyOptions: "identify-options",
  splitOptions: "split-options",
  // Selects
  fromSchemeSelect: "from-scheme-select",
  toSchemeSelect: "to-scheme-select",
  resplitSelect: "resplit-select",
  splitterModelSelect: "splitter-model-select",
  // Checkboxes
  preserveAunuasikaCheckbox: "preserve-anunasika-checkbox",
  avoidViramaIndicCheckbox: "avoid-virama-indic-checkbox",
  avoidViramaNonIndicCheckbox: "avoid-virama-non-indic-checkbox",
  preserveCompoundHyphensCheckbox: "preserve-compound-hyphens-checkbox",
  preservePunctuationCheckbox: "preserve-punctuation-checkbox",
  showWeightsCheckbox: "show-weights-checkbox",
  showMoraeCheckbox: "show-morae-checkbox",
  showGaRasCheckbox: "show-garas-checkbox",
  showAlignmentCheckbox: "show-alignment-checkbox",
};

export const FONT_SIZE_KEY = "sk_font_size";
export const FONT_SIZE_DEFAULT = "small";
export const FONT_SIZE_CSS_VAR = "--font-size-base";
export const FONT_SIZE_MAP = {
  small: "0.9rem",
  medium: "1rem",
  large: "1.15rem",
};
