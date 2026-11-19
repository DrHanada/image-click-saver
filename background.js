const defaults = {
  enabled: false,
  naming: "original",
  prefix: "image_",
  digits: 3,
  sequence: 1,
  language: "ja"
};

function updateActionTitle(language) {
  const title = language === "en"
    ? "Image Click Saver"
    : "画像クリック保存";

  return browser.action.setTitle({ title });
}

browser.storage.local.get({ language: "ja" }).then((settings) => {
  updateActionTitle(settings.language);
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.language) {
    updateActionTitle(changes.language.newValue);
  }
});

// 連続クリック時も、通し番号をクリック順に処理します。
let saveQueue = Promise.resolve();

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== "save-image") return undefined;

  const operation = saveQueue.then(() => saveImage(message));
  saveQueue = operation.catch(() => {});
  return operation;
});

async function saveImage(message) {
  const settings = {
    ...defaults,
    ...(await browser.storage.local.get(defaults))
  };

  if (!settings.enabled) return { ok: false };

  let url;
  try {
    url = new URL(message.url);
  } catch {
    return { ok: false };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false };
  }

  const extension = getExtension(url.pathname);
  let filename;

  if (settings.naming === "sequence") {
    const number = Math.max(1, Number(settings.sequence) || 1);
    const digits = Math.max(1, Math.min(8, Number(settings.digits) || 3));
    const prefix = sanitize(settings.prefix || "image_");

    filename = `${prefix}${String(number).padStart(digits, "0")}.${extension}`;
    await browser.storage.local.set({ sequence: number + 1 });
  } else {
    filename = getOriginalName(url.pathname, message.alt, extension);
  }

  try {
    await browser.downloads.download({
      url: url.href,
      filename,
      saveAs: false,
      conflictAction: "uniquify"
    });
    return { ok: true };
  } catch (error) {
    console.error("画像のダウンロードに失敗しました:", error);
    return { ok: false };
  }
}

function getExtension(pathname) {
  const match = pathname.match(/\.([a-zA-Z0-9]{1,8})$/);
  return match ? match[1].toLowerCase() : "img";
}

function getOriginalName(pathname, alt, extension) {
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  let name = lastSegment;

  try {
    name = decodeURIComponent(name);
  } catch {
    // 不正なパーセントエンコードの場合は元の文字列を使います。
  }

  if (!name || name === "." || name === "..") {
    name = alt ? `${alt}.${extension}` : `image.${extension}`;
  }

  return sanitize(name);
}

function sanitize(name) {
  return name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/^\.+$/, "image")
    .slice(0, 180) || "image";
}