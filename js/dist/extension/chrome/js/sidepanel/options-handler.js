import {
  STORAGE_KEYS,
  FEATURE_TABS,
  SCHEMES,
  SCHEMES_OUTPUT,
  RESPLIT_OPTIONS,
  SPLITTER_MODELS,
  SIDEPANEL_ELEMENT_IDS,
  FONT_SIZE_KEY,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_CSS_VAR,
  FONT_SIZE_MAP,
} from "../constants.js";

const FEATURE_TAB_DEFAULTS = {
  [STORAGE_KEYS.featureTab]: FEATURE_TABS.transliterate,
  [STORAGE_KEYS.fromScheme]: "AUTO",
  [STORAGE_KEYS.toScheme]: "IAST",
  [STORAGE_KEYS.resplitOption]: "resplit_max",
  [STORAGE_KEYS.preserveAnunasika]: false,
  [STORAGE_KEYS.avoidViramaIndic]: true,
  [STORAGE_KEYS.avoidViramaNonIndic]: false,
  [STORAGE_KEYS.splitterModel]: "dharmamitra_2024_sept",
  [STORAGE_KEYS.preserveCompoundHyphens]: true,
  [STORAGE_KEYS.preservePunctuation]: true,
  [STORAGE_KEYS.showWeights]: true,
  [STORAGE_KEYS.showMorae]: true,
  [STORAGE_KEYS.showGaRas]: true,
  [STORAGE_KEYS.showAlignment]: true,
};

export async function loadOptions() {
  const items = await browser.storage.sync.get(FEATURE_TAB_DEFAULTS);
  return items;
}

export async function saveOption(key, value) {
  await browser.storage.sync.set({ [key]: value });
}

export function populateSelects() {
  const fromSchemeEl = document.getElementById(SIDEPANEL_ELEMENT_IDS.fromSchemeSelect);
  const toSchemeEl = document.getElementById(SIDEPANEL_ELEMENT_IDS.toSchemeSelect);
  const resplitEl = document.getElementById(SIDEPANEL_ELEMENT_IDS.resplitSelect);
  const splitterModelEl = document.getElementById(SIDEPANEL_ELEMENT_IDS.splitterModelSelect);

  SCHEMES.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    fromSchemeEl.appendChild(opt);
  });

  SCHEMES_OUTPUT.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    toSchemeEl.appendChild(opt);
  });

  RESPLIT_OPTIONS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    resplitEl.appendChild(opt);
  });

  SPLITTER_MODELS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    splitterModelEl.appendChild(opt);
  });
}

export async function restoreOptions() {
  const items = await loadOptions();

  document.getElementById(SIDEPANEL_ELEMENT_IDS.fromSchemeSelect).value = items[STORAGE_KEYS.fromScheme];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.toSchemeSelect).value = items[STORAGE_KEYS.toScheme];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.resplitSelect).value = items[STORAGE_KEYS.resplitOption];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.preserveAunuasikaCheckbox).checked = items[STORAGE_KEYS.preserveAnunasika];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.avoidViramaIndicCheckbox).checked = items[STORAGE_KEYS.avoidViramaIndic];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.avoidViramaNonIndicCheckbox).checked = items[STORAGE_KEYS.avoidViramaNonIndic];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.splitterModelSelect).value = items[STORAGE_KEYS.splitterModel];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.preserveCompoundHyphensCheckbox).checked = items[STORAGE_KEYS.preserveCompoundHyphens];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.preservePunctuationCheckbox).checked = items[STORAGE_KEYS.preservePunctuation];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.showWeightsCheckbox).checked = items[STORAGE_KEYS.showWeights];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.showMoraeCheckbox).checked = items[STORAGE_KEYS.showMorae];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.showGaRasCheckbox).checked = items[STORAGE_KEYS.showGaRas];
  document.getElementById(SIDEPANEL_ELEMENT_IDS.showAlignmentCheckbox).checked = items[STORAGE_KEYS.showAlignment];

  // Font size
  const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || FONT_SIZE_DEFAULT;
  document.documentElement.style.setProperty(FONT_SIZE_CSS_VAR, FONT_SIZE_MAP[savedFontSize]);
  const radios = document.querySelectorAll('input[name="font-size"]');
  radios.forEach(r => { r.checked = r.value === savedFontSize; });

  return items;
}

export function setupOptionListeners(onOptionsChange) {
  const bind = (id, key, getter) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", async (e) => {
      const val = getter(e.target);
      await saveOption(key, val);
      onOptionsChange();
    });
  };

  bind(SIDEPANEL_ELEMENT_IDS.fromSchemeSelect, STORAGE_KEYS.fromScheme, t => t.value);
  bind(SIDEPANEL_ELEMENT_IDS.toSchemeSelect, STORAGE_KEYS.toScheme, t => t.value);
  bind(SIDEPANEL_ELEMENT_IDS.resplitSelect, STORAGE_KEYS.resplitOption, t => t.value);
  bind(SIDEPANEL_ELEMENT_IDS.preserveAunuasikaCheckbox, STORAGE_KEYS.preserveAnunasika, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.avoidViramaIndicCheckbox, STORAGE_KEYS.avoidViramaIndic, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.avoidViramaNonIndicCheckbox, STORAGE_KEYS.avoidViramaNonIndic, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.splitterModelSelect, STORAGE_KEYS.splitterModel, t => t.value);
  bind(SIDEPANEL_ELEMENT_IDS.preserveCompoundHyphensCheckbox, STORAGE_KEYS.preserveCompoundHyphens, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.preservePunctuationCheckbox, STORAGE_KEYS.preservePunctuation, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.showWeightsCheckbox, STORAGE_KEYS.showWeights, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.showMoraeCheckbox, STORAGE_KEYS.showMorae, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.showGaRasCheckbox, STORAGE_KEYS.showGaRas, t => t.checked);
  bind(SIDEPANEL_ELEMENT_IDS.showAlignmentCheckbox, STORAGE_KEYS.showAlignment, t => t.checked);

  // Font size
  document.querySelectorAll('input[name="font-size"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.documentElement.style.setProperty(FONT_SIZE_CSS_VAR, FONT_SIZE_MAP[e.target.value]);
        localStorage.setItem(FONT_SIZE_KEY, e.target.value);
      }
    });
  });
}
