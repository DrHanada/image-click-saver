const defaults = {
  enabled: false,
  naming: "original",
  prefix: "image_",
  digits: 3,
  sequence: 1,
  startNumber: 1,
  language: "ja"
};

const translations = {
  ja: {
    language: "表示言語",
    enabled: "画像クリック保存モード",
    naming: "ファイル名",
    original: "画像の元の名前",
    sequence: "通し番号",
    prefix: "ファイル名の接頭辞",
    digits: "番号の桁数",
    startNumber: "開始番号",
    resetSequence: "通し番号をリセット",
    sequenceResetStatus: "通し番号を開始番号にリセットしました。",
    enabledStatus: "保存モードはオンです。ページ内の画像をクリックしてください。",
    disabledStatus: "保存モードはオフです。"
  },
  en: {
    language: "Display language",
    enabled: "Image click save mode",
    naming: "Filename",
    original: "Original image filename",
    sequence: "Sequential numbering",
    prefix: "Filename prefix",
    digits: "Number of digits",
    startNumber: "Starting number",
    resetSequence: "Reset sequence number",
    sequenceResetStatus: "Sequence number has been reset to the starting number.",
    enabledStatus: "Save mode is on. Click an image on the page to download it.",
    disabledStatus: "Save mode is off."
  }
};

const languageInput = document.getElementById("language");
const enabledInput = document.getElementById("enabled");
const namingInput = document.getElementById("naming");
const prefixInput = document.getElementById("prefix");
const digitsInput = document.getElementById("digits");
const startNumberInput = document.getElementById("startNumber");
const sequenceOptions = document.getElementById("sequenceOptions");
const resetSequenceButton = document.getElementById("resetSequence");
const status = document.getElementById("status");

let currentLanguage = "ja";
let statusMessage = "";

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : fallback;
}

async function loadSettings() {
  const settings = {
    ...defaults,
    ...(await browser.storage.local.get(defaults))
  };

  languageInput.value = settings.language === "en" ? "en" : "ja";
  enabledInput.checked = settings.enabled;
  namingInput.value = settings.naming;
  prefixInput.value = settings.prefix;
  digitsInput.value = settings.digits;
  startNumberInput.value = positiveInteger(settings.startNumber);

  applyLanguage();
}

function applyLanguage() {
  currentLanguage = languageInput.value === "en" ? "en" : "ja";
  const text = translations[currentLanguage];

  document.documentElement.lang = currentLanguage;
  document.getElementById("languageLabel").textContent = text.language;
  document.getElementById("enabledLabel").textContent = text.enabled;
  document.getElementById("namingLabel").textContent = text.naming;
  document.getElementById("originalOption").textContent = text.original;
  document.getElementById("sequenceOption").textContent = text.sequence;
  document.getElementById("prefixLabel").textContent = text.prefix;
  document.getElementById("digitsLabel").textContent = text.digits;
  document.getElementById("startNumberLabel").textContent = text.startNumber;
  resetSequenceButton.textContent = text.resetSequence;

  // Keep the reset button visible even when original filenames are selected.
  sequenceOptions.hidden = namingInput.value !== "sequence";
  status.textContent = statusMessage || (enabledInput.checked
    ? text.enabledStatus
    : text.disabledStatus);
}

async function saveSettings() {
  await browser.storage.local.set({
    enabled: enabledInput.checked,
    naming: namingInput.value,
    prefix: prefixInput.value || "image_",
    digits: Math.max(1, Math.min(8, Number(digitsInput.value) || 3)),
    language: languageInput.value
  });

  statusMessage = "";
  applyLanguage();
}

async function saveStartNumber() {
  const startNumber = positiveInteger(startNumberInput.value);
  startNumberInput.value = startNumber;

  // Choosing a new start number also sets the next number to be used.
  await browser.storage.local.set({ startNumber, sequence: startNumber });
  statusMessage = "";
  applyLanguage();
}

async function resetSequence() {
  const settings = await browser.storage.local.get({ startNumber: defaults.startNumber });
  const startNumber = positiveInteger(settings.startNumber);
  await browser.storage.local.set({ sequence: startNumber });
  statusMessage = translations[currentLanguage].sequenceResetStatus;
  applyLanguage();
}

languageInput.addEventListener("change", saveSettings);
enabledInput.addEventListener("change", saveSettings);
namingInput.addEventListener("change", saveSettings);
prefixInput.addEventListener("change", saveSettings);
digitsInput.addEventListener("change", saveSettings);
startNumberInput.addEventListener("change", saveStartNumber);
resetSequenceButton.addEventListener("click", resetSequence);

loadSettings();
