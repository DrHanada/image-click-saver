let enabled = false;
let language = "ja";

browser.storage.local.get({ enabled: false, language: "ja" }).then((settings) => {
  enabled = settings.enabled;
  language = settings.language === "en" ? "en" : "ja";
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
  if (changes.language) {
    language = changes.language.newValue === "en" ? "en" : "ja";
  }
});

document.addEventListener("click", async (event) => {
  if (!enabled) return;

  const image = event.composedPath().find(
    (element) => element instanceof HTMLImageElement
  );
  if (!image) return;

  const url = image.currentSrc || image.src;
  if (!url) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  try {
    const result = await browser.runtime.sendMessage({
      type: "save-image",
      url,
      alt: image.alt || ""
    });

    showNotice(result?.ok
      ? (language === "en" ? "Image download started" : "画像の保存を開始しました")
      : (language === "en" ? "Could not save the image" : "画像を保存できませんでした"));
  } catch {
    showNotice(language === "en"
      ? "Could not save the image"
      : "画像を保存できませんでした");
  }
}, true);

function showNotice(message) {
  let notice = document.getElementById("__image_click_saver_notice__");

  if (!notice) {
    notice = document.createElement("div");
    notice.id = "__image_click_saver_notice__";
    Object.assign(notice.style, {
      position: "fixed",
      zIndex: "2147483647",
      right: "16px",
      bottom: "16px",
      padding: "8px 12px",
      color: "white",
      background: "rgba(0, 0, 0, 0.8)",
      borderRadius: "6px",
      font: "14px sans-serif",
      pointerEvents: "none"
    });
    document.documentElement.appendChild(notice);
  }

  notice.textContent = message;
  notice.style.display = "block";
  clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => {
    notice.style.display = "none";
  }, 1800);
}