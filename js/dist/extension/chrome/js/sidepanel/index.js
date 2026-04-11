// Apply theme before paint to avoid flash
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

/**
 * Skrutable extension sidepanel — ported from skrutable web app JS.
 * Replaces server fetch() calls with direct Skrutable bundle calls.
 * Replaces session/server settings persistence with browser.storage.sync.
 */

// --- Storage keys (match existing extension convention) ---
const SK = {
  action:                 "featureTab",
  fromScheme:             "fromScheme",
  toScheme:               "toScheme",
  resplitOption:          "resplitOption",
  splitterModel:          "splitterModel",
  weights:                "showWeights",
  morae:                  "showMorae",
  gaRas:                  "showGaRas",
  alignment:              "showAlignment",
  avoidViramaIndic:       "avoidViramaIndic",
  avoidViramaNonIndic:    "avoidViramaNonIndic",
  preserveAnunasika:      "preserveAnunasika",
  preserveCompoundHyphens:"preserveCompoundHyphens",
  preservePunctuation:    "preservePunctuation",
  fontSize:               "fontSize",
};

const DEFAULTS = {
  [SK.action]:                  "transliterate",
  [SK.fromScheme]:              "Auto",
  [SK.toScheme]:                "IAST",
  [SK.resplitOption]:           "resplit_lite_keep_mid",
  [SK.splitterModel]:           "dharmamitra_2024_sept",
  [SK.weights]:                 true,
  [SK.morae]:                   true,
  [SK.gaRas]:                   true,
  [SK.alignment]:               true,
  [SK.avoidViramaIndic]:        true,
  [SK.avoidViramaNonIndic]:     false,
  [SK.preserveAnunasika]:       false,
  [SK.preserveCompoundHyphens]: true,
  [SK.preservePunctuation]:     true,
  [SK.fontSize]:                "medium",
};

const FONT_SIZE_MAP = { small: "1rem", medium: "1.15rem", large: "1.3rem" };
const MELODY_BASE = "https://www.skrutable.info/assets/melodies/";
// --- Page state ---
var currentAction = "";
var currentMeterLabel = "";
var currentMelodyOptions = [];

// --- Settings state (mirrors web app globals) ---
var currentAvoidVirama = true;
var currentAvoidViramanonIndic = false;
var currentPreserveAnunasika = false;
var currentPreserveCompoundHyphens = true;
var currentPreservePunctuation = true;

// --- Sidebar callback hooks (called by HTML onclick) ---
function onActionButton(action) {
  var handlers = {
    'transliterate': doTransliterate,
    'scan': doScan,
    'identify meter': doIdentifyMeter,
    'split': doSplit,
  };
  if (handlers[action]) handlers[action]();
}

function onSidebarChange() {
  saveSettings();
}

// --- getSidebarSettings (mirrors settings.js) ---
function getSidebarSettings() {
  return {
    from_scheme:    document.getElementById("from_scheme").value,
    to_scheme:      document.getElementById("to_scheme").value,
    resplit_option: document.getElementById("resplit_option").value,
    splitter_model: document.getElementById("splitter_model_sidebar").value,
    weights:        document.getElementById("weights").checked,
    morae:          document.getElementById("morae").checked,
    gaRas:          document.getElementById("gaRas").checked,
    alignment:      document.getElementById("alignment").checked,
  };
}

// --- Settings persistence ---
async function saveSettings() {
  var s = getSidebarSettings();
  await browser.storage.sync.set({
    [SK.action]:                  currentAction,
    [SK.fromScheme]:              s.from_scheme,
    [SK.toScheme]:                s.to_scheme,
    [SK.resplitOption]:           s.resplit_option,
    [SK.splitterModel]:           s.splitter_model,
    [SK.weights]:                 s.weights,
    [SK.morae]:                   s.morae,
    [SK.gaRas]:                   s.gaRas,
    [SK.alignment]:               s.alignment,
    [SK.avoidViramaIndic]:        currentAvoidVirama,
    [SK.avoidViramaNonIndic]:     currentAvoidViramanonIndic,
    [SK.preserveAnunasika]:       currentPreserveAnunasika,
    [SK.preserveCompoundHyphens]: currentPreserveCompoundHyphens,
    [SK.preservePunctuation]:     currentPreservePunctuation,
  });
}

async function restoreSettings() {
  const items = await browser.storage.sync.get(DEFAULTS);

  document.getElementById("from_scheme").value = items[SK.fromScheme];
  document.getElementById("to_scheme").value = items[SK.toScheme];
  document.getElementById("resplit_option").value = items[SK.resplitOption];
  document.getElementById("splitter_model_sidebar").value = items[SK.splitterModel];
  document.getElementById("weights").checked = items[SK.weights];
  document.getElementById("morae").checked = items[SK.morae];
  document.getElementById("gaRas").checked = items[SK.gaRas];
  document.getElementById("alignment").checked = items[SK.alignment];

  currentAvoidVirama = items[SK.avoidViramaIndic];
  currentAvoidViramanonIndic = items[SK.avoidViramaNonIndic];
  currentPreserveAnunasika = items[SK.preserveAnunasika];
  currentPreserveCompoundHyphens = items[SK.preserveCompoundHyphens];
  currentPreservePunctuation = items[SK.preservePunctuation];

  document.getElementById("avoid_virama").checked = currentAvoidVirama;
  document.getElementById("avoid_virama_non_indic").checked = currentAvoidViramanonIndic;
  document.getElementById("preserve_anunasika").checked = currentPreserveAnunasika;
  document.getElementById("preserve_compound_hyphens").checked = currentPreserveCompoundHyphens;
  document.getElementById("preserve_punctuation").checked = currentPreservePunctuation;
  document.getElementById("splitter_model_settings").value = items[SK.splitterModel];
  updateSettingsExamples();
  updateCompoundHyphensVisibility();

  const fontSize = items[SK.fontSize] || "medium";
  document.getElementById("font_size_select").value = fontSize;
  applyFontSize(fontSize);

  if (items[SK.action]) {
    currentAction = items[SK.action];
    highlightActionButton(currentAction);
    document.getElementById("repeat_action_button").disabled = !currentAction;
  }
}

// --- Font size ---
function applyFontSize(size) {
  document.body.style.fontSize = FONT_SIZE_MAP[size] || FONT_SIZE_MAP.medium;
}

// --- Text persistence (localStorage) ---
function saveTexts() {
  localStorage.setItem("sk_text_input", document.getElementById("text_input").value);
  localStorage.setItem("sk_text_output", document.getElementById("text_output").value);
}

function restoreTexts() {
  var inp = document.getElementById("text_input");
  var out = document.getElementById("text_output");
  var saved_in = localStorage.getItem("sk_text_input");
  var saved_out = localStorage.getItem("sk_text_output");
  if (saved_in) inp.value = saved_in;
  if (saved_out) out.value = saved_out;
}

function clearTextAreas() {
  document.getElementById("text_input").value = "";
  document.getElementById("text_output").value = "";
  saveTexts();
  hideMelodyPlayer();
  var opt = document.getElementById("auto_scheme_option");
  if (opt) opt.textContent = "Auto";
}

function clearTexts() {
  clearTextAreas();
  currentAction = "";
  highlightActionButton("");
  document.getElementById("repeat_action_button").disabled = true;
  saveSettings();
}

function repeatLastAction() {
  if (currentAction) onActionButton(currentAction);
}

function swapTexts() {
  var inp = document.getElementById("text_input");
  var out = document.getElementById("text_output");
  var tmp = inp.value;
  inp.value = out.value;
  out.value = tmp;
  saveTexts();
}

// --- Scheme helpers (mirrors settings.js) ---
function swapSchemeSelects() {
  var from = document.getElementById("from_scheme");
  var to = document.getElementById("to_scheme");
  if (from.value === "Auto") {
    var opt = document.getElementById("auto_scheme_option");
    var match = opt.textContent.match(/^Auto:\s*(\S+?)(?:\s*\(\?\))?$/);
    if (!match) return;
    from.value = to.value;
    to.value = match[1];
    opt.textContent = "Auto";
    return;
  }
  var tmp = from.value;
  from.value = to.value;
  to.value = tmp;
}

function updateAutoLabel(detectedScheme, confidence) {
  var opt = document.getElementById("auto_scheme_option");
  if (!opt) return;
  opt.textContent = "Auto: " + detectedScheme + (confidence === "low" ? " (?)" : "");
}

// --- Action button highlighting ---
var actionButtonMap = {
  'transliterate':  'transliterate_button',
  'scan':           'scan_button',
  'identify meter': 'identify_meter_button',
  'split':          'split_button',
};

function highlightActionButton(action) {
  for (var key in actionButtonMap) {
    var btn = document.getElementById(actionButtonMap[key]);
    if (btn) btn.classList.toggle("active", key === action);
  }
}

function set_action(action) {
  currentAction = action;
  highlightActionButton(action);
  document.getElementById("repeat_action_button").disabled = !action;
  saveSettings();
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "...";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}

// --- Feature actions (using Skrutable bundle directly) ---
async function doTransliterate() {
  var btn = document.getElementById("transliterate_button");
  setButtonLoading(btn, true);
  try {
    var s = getSidebarSettings();
    var fromScheme = s.from_scheme === "Auto" ? null : s.from_scheme;
    var T = new Skrutable.Transliterator(fromScheme, s.to_scheme);
    var result = T.transliterate(
      document.getElementById("text_input").value,
      s.from_scheme === "Auto" ? "AUTO" : null,
      null,
      currentAvoidVirama,
      currentAvoidViramanonIndic,
      currentPreserveAnunasika
    );
    document.getElementById("text_output").value = result;
    saveTexts();
    set_action("transliterate");
    hideMelodyPlayer();
  } catch(e) {
    document.getElementById("text_output").value = "Error: " + e.message;
  } finally {
    setButtonLoading(btn, false);
  }
}

async function doScan() {
  var btn = document.getElementById("scan_button");
  setButtonLoading(btn, true);
  try {
    var s = getSidebarSettings();
    var fromScheme = s.from_scheme === "Auto" ? null : s.from_scheme;
    var S = new Skrutable.Scanner();
    var verse = S.scan(document.getElementById("text_input").value, fromScheme);
    var result = verse.summarize(s.weights, s.morae, s.gaRas, s.alignment, false);
    document.getElementById("text_output").value = result;
    saveTexts();
    set_action("scan");
    hideMelodyPlayer();
  } catch(e) {
    document.getElementById("text_output").value = "Error: " + e.message;
  } finally {
    setButtonLoading(btn, false);
  }
}

async function doIdentifyMeter() {
  var btn = document.getElementById("identify_meter_button");
  setButtonLoading(btn, true);
  try {
    var s = getSidebarSettings();
    var fromScheme = s.from_scheme === "Auto" ? null : s.from_scheme;
    var MI = new Skrutable.MeterIdentifier();
    var verse = MI.identify_meter(
      document.getElementById("text_input").value,
      s.resplit_option,
      false,
      fromScheme
    );
    var result = verse.summarize(s.weights, s.morae, s.gaRas, s.alignment, true);
    document.getElementById("text_output").value = result;
    saveTexts();
    set_action("identify meter");

    currentMeterLabel = verse.meterLabel || "";
    updateMelodyPlayer(currentMeterLabel);
  } catch(e) {
    document.getElementById("text_output").value = "Error: " + e.message;
  } finally {
    setButtonLoading(btn, false);
  }
}

async function doSplit() {
  var btn = document.getElementById("split_button");
  setButtonLoading(btn, true);
  try {
    var s = getSidebarSettings();
    var fromScheme = s.from_scheme === "Auto" ? null : s.from_scheme;
    var Spl = new Skrutable.Splitter();
    var result = await Spl.split(
      document.getElementById("text_input").value,
      fromScheme,
      s.to_scheme,
      s.splitter_model,
      currentPreserveCompoundHyphens,
      currentPreservePunctuation
    );
    document.getElementById("text_output").value = result;
    saveTexts();
    set_action("split");
    hideMelodyPlayer();
  } catch(e) {
    document.getElementById("text_output").value = "Error: " + e.message;
  } finally {
    setButtonLoading(btn, false);
  }
}

// --- Melody player ---
function updateMelodyPlayer(meterLabel) {
  hideMelodyPlayer();
  if (!meterLabel) return;
  // Extract bare meter name: first word, strip trailing 'm' (accusative ending on samavṛtta names)
  var bareName = meterLabel.split(' ')[0].replace(/m$/, '');
  var options = Skrutable.meter_melodies[bareName] || [];
  if (options.length > 0) {
    currentMeterLabel = bareName;
    currentMelodyOptions = options;
    rebuildMelodyDropdown(currentMelodyOptions);
    showMelodyPlayer();
    updateMelody();
  }
}

function rebuildMelodyDropdown(options) {
  var sel = document.getElementById("melody_option");
  sel.innerHTML = "";
  options.forEach(function(o) {
    var opt = document.createElement("option");
    opt.value = o;
    opt.textContent = o;
    sel.appendChild(opt);
  });
}

// JS meter labels that differ from the server's HK-transliterated filenames
var MELODY_FILENAME_OVERRIDES = {
  'anuṣṭup':       'anuSTubh',
  'drutavilambitam': 'drutavilambita',
  'upagītiḥ':      'upagIti',
  'upajātiḥ':      'upajAti',
};

function updateMelody() {
  var sel = document.getElementById("melody_option");
  var audio = document.getElementById("audio");
  if (!sel.value || !currentMeterLabel) return;
  var meterHK = MELODY_FILENAME_OVERRIDES[currentMeterLabel] ||
    new Skrutable.Transliterator('IAST', 'HK').transliterate(currentMeterLabel);
  var name = sel.value.replace(/ /g, "-").replace(/\./g, "");
  audio.src = MELODY_BASE + meterHK + "-" + name + ".mp3";
}

function showMelodyPlayer() {
  document.getElementById("melodyPlayer").classList.add("visible");
}

function hideMelodyPlayer() {
  currentMeterLabel = "";
  currentMelodyOptions = [];
  document.getElementById("melodyPlayer").classList.remove("visible");
}

// --- Settings panel toggle ---
function toggleSettings() {
  var workbench = document.getElementById("workbench-view");
  var settings = document.getElementById("settings-view");
  var isSettings = settings.style.display !== "none";
  workbench.style.display = isSettings ? "" : "none";
  settings.style.display = isSettings ? "none" : "";
  document.body.classList.toggle("settings-open", !isSettings);
  if (!isSettings) closeSidebarOnMobile();
}

// --- Settings panel change handlers ---
function bindSettingsCheckbox(id, getter, setter, onChangeCb) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", function() {
    setter(getter(el));
    if (onChangeCb) onChangeCb();
    saveSettings();
  });
}

function updateSettingsExamples() {
  var virOn = document.getElementById("avoid_virama").checked;
  document.getElementById("virama_example_on").style.display = virOn ? "" : "none";
  document.getElementById("virama_example_off").style.display = virOn ? "none" : "";

  var virNIOn = document.getElementById("avoid_virama_non_indic").checked;
  document.getElementById("virama_non_indic_example_on").style.display = virNIOn ? "" : "none";
  document.getElementById("virama_non_indic_example_off").style.display = virNIOn ? "none" : "";

  var anuOn = document.getElementById("preserve_anunasika").checked;
  document.getElementById("anunasika_example_on").style.display = anuOn ? "" : "none";
  document.getElementById("anunasika_example_off").style.display = anuOn ? "none" : "";

  var hypOn = document.getElementById("preserve_compound_hyphens").checked;
  document.getElementById("hyphens_example_on").style.display = hypOn ? "" : "none";
  document.getElementById("hyphens_example_off").style.display = hypOn ? "none" : "";
}

function updateCompoundHyphensVisibility() {
  var model = document.getElementById("splitter_model_settings").value;
  var row = document.getElementById("preserve_compound_hyphens_row");
  row.style.display = model === "dharmamitra_2024_sept" ? "" : "none";
}

function resetExtraSettings() {
  currentAvoidVirama = DEFAULTS[SK.avoidViramaIndic];
  currentAvoidViramanonIndic = DEFAULTS[SK.avoidViramaNonIndic];
  currentPreserveAnunasika = DEFAULTS[SK.preserveAnunasika];
  currentPreserveCompoundHyphens = DEFAULTS[SK.preserveCompoundHyphens];
  currentPreservePunctuation = DEFAULTS[SK.preservePunctuation];
  document.getElementById("avoid_virama").checked = currentAvoidVirama;
  document.getElementById("avoid_virama_non_indic").checked = currentAvoidViramanonIndic;
  document.getElementById("preserve_anunasika").checked = currentPreserveAnunasika;
  document.getElementById("preserve_compound_hyphens").checked = currentPreserveCompoundHyphens;
  document.getElementById("preserve_punctuation").checked = currentPreservePunctuation;
  var defaultModel = DEFAULTS[SK.splitterModel];
  document.getElementById("splitter_model_settings").value = defaultModel;
  document.getElementById("splitter_model_sidebar").value = defaultModel;
  updateSettingsExamples();
  updateCompoundHyphensVisibility();
  saveSettings();
}

function resetAllSettings() {
  browser.storage.sync.clear().then(function() {
    location.reload();
  });
}

// --- Dark mode ---
function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

// --- Background message listener (inject selected text) ---
browser.runtime.onMessage.addListener(function(message) {
  if (message.selectionText) {
    document.getElementById("text_input").value = message.selectionText;
    document.getElementById("text_output").value = "";
    saveTexts();
    hideMelodyPlayer();
  }
  return false;
});

// --- Sidebar burger ---
function closeSidebarOnMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

function initBurger() {
  var burger = document.getElementById("sidebar-burger");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");

  function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("open"); }

  burger.addEventListener("click", function() {
    sidebar.classList.contains("open") ? closeSidebarOnMobile() : openSidebar();
  });
  overlay.addEventListener("click", closeSidebarOnMobile);
}

// --- Init ---
document.addEventListener("DOMContentLoaded", async function() {

  initBurger();

  // Dark mode
  var isDarkInit = localStorage.getItem("theme") === "dark";
  applyTheme(isDarkInit);
  document.getElementById("dark_mode_checkbox").checked = isDarkInit;
  document.getElementById("dark_mode_checkbox").addEventListener("change", function() {
    var isDark = this.checked;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    applyTheme(isDark);
  });

  // Action buttons
  document.getElementById("transliterate_button").addEventListener("click", function() { closeSidebarOnMobile(); onActionButton("transliterate"); });
  document.getElementById("scan_button").addEventListener("click", function() { closeSidebarOnMobile(); onActionButton("scan"); });
  document.getElementById("identify_meter_button").addEventListener("click", function() { closeSidebarOnMobile(); onActionButton("identify meter"); });
  document.getElementById("split_button").addEventListener("click", function() { closeSidebarOnMobile(); onActionButton("split"); });

  // Scheme controls
  document.getElementById("from_scheme").addEventListener("change", onSidebarChange);
  document.getElementById("to_scheme").addEventListener("change", onSidebarChange);
  document.getElementById("swap_scheme_button").addEventListener("click", function() { swapSchemeSelects(); onSidebarChange(); });

  // Scan checkboxes
  document.getElementById("weights").addEventListener("change", onSidebarChange);
  document.getElementById("morae").addEventListener("change", onSidebarChange);
  document.getElementById("gaRas").addEventListener("change", onSidebarChange);
  document.getElementById("alignment").addEventListener("change", onSidebarChange);

  // Identify Meter / Split selects
  document.getElementById("resplit_option").addEventListener("change", onSidebarChange);
  document.getElementById("splitter_model_sidebar").addEventListener("change", onSidebarChange);

  // Textarea action buttons
  document.getElementById("clear_textareas_button").addEventListener("click", clearTextAreas);
  document.getElementById("repeat_action_button").addEventListener("click", repeatLastAction);
  document.getElementById("swap_texts_button").addEventListener("click", swapTexts);

  // Sidebar bottom links
  document.getElementById("clear-texts-link").addEventListener("click", function(e) { e.preventDefault(); clearTexts(); });
  document.getElementById("settings-link").addEventListener("click", function(e) { e.preventDefault(); closeSidebarOnMobile(); toggleSettings(); });
  document.getElementById("settings-back-arrow").addEventListener("click", toggleSettings);
  document.getElementById("settings-back-brand").addEventListener("click", function(e) { e.preventDefault(); toggleSettings(); });

  // Melody dropdown change
  document.getElementById("melody_option").addEventListener("change", updateMelody);

  // Restore settings and texts
  await restoreSettings();
  restoreTexts();

  // Settings panel checkbox bindings
  bindSettingsCheckbox("avoid_virama", function(el) { return el.checked; }, function(v) { currentAvoidVirama = v; }, updateSettingsExamples);
  bindSettingsCheckbox("avoid_virama_non_indic", function(el) { return el.checked; }, function(v) { currentAvoidViramanonIndic = v; }, updateSettingsExamples);
  bindSettingsCheckbox("preserve_anunasika", function(el) { return el.checked; }, function(v) { currentPreserveAnunasika = v; }, updateSettingsExamples);
  bindSettingsCheckbox("preserve_compound_hyphens", function(el) { return el.checked; }, function(v) { currentPreserveCompoundHyphens = v; }, updateSettingsExamples);
  bindSettingsCheckbox("preserve_punctuation", function(el) { return el.checked; }, function(v) { currentPreservePunctuation = v; });

  document.getElementById("splitter_model_settings").addEventListener("change", function() {
    var model = this.value;
    document.getElementById("splitter_model_sidebar").value = model;
    updateCompoundHyphensVisibility();
    saveSettings();
  });

  document.getElementById("font_size_select").addEventListener("change", function() {
    var size = this.value;
    applyFontSize(size);
    browser.storage.sync.set({ [SK.fontSize]: size });
  });

  document.getElementById("reset_extra_button").addEventListener("click", resetExtraSettings);
  document.getElementById("reset_all_button").addEventListener("click", resetAllSettings);

  // Text persistence on edit
  document.getElementById("text_input").addEventListener("input", saveTexts);
});
