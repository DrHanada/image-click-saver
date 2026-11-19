const defaults = {
  enabled: false,
  naming: "original",
  prefix: "image_",
  digits: 3,
  sequence: 1,
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
    enabledStatus: "Save mode is on. Click an image on the page to download it.",
    disabledStatus: "Save mode is off."
  }
};

const languageInput = document.getElementById("language");
const enabledInput = document.getElementById("enabled");
const namingInput = document.getElementById("naming");
const prefixInput = document.getElementById("prefix");
const digitsInput = document.getElementById("digits");
const sequenceOptions = document.getElementById("sequenceOptions");
const status = document.getElementById("status");

let currentLanguage = "ja";

async function loadSettings() {
  const settings = {
    ...defaults,
    ...(await browser.storage.local.get(defaults))
  };

  languageInput.value = settings.language;
  enabledInput.checked = settings.enabled;
  namingInput.value = settings.naming;
  prefixInput.value = settings.prefix;
  digitsInput.value = settings.digits;

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

  sequenceOptions.hidden = namingInput.value !== "sequence";
  status.textContent = enabledInput.checked
    ? text.enabledStatus
    : text.disabledStatus;
}

async function saveSettings() {
  await browser.storage.local.set({
    enabled: enabledInput.checked,
    naming: namingInput.value,
    prefix: prefixInput.value || "image_",
    digits: Math.max(1, Math.min(8, Number(digitsInput.value) || 3)),
    language: languageInput.value
  });

  applyLanguage();
}

languageInput.addEventListener("change", saveSettings);
enabledInput.addEventListener("change", saveSettings);
namingInput.addEventListener("change", saveSettings);
prefixInput.addEventListener("change", saveSettings);
digitsInput.addEventListener("change", saveSettings);

loadSettings();