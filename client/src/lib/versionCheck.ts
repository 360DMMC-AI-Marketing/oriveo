const CURRENT_ENTRY =
  document.querySelector('script[src*="/assets/index-"]')?.getAttribute("src") ?? "";

async function checkForUpdate() {
  try {
    const res = await fetch(`/index.html?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const html = await res.text();
    const latest = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0] ?? "";
    if (latest && CURRENT_ENTRY && latest !== CURRENT_ENTRY) {
      window.location.reload();
    }
  } catch {
    /* ignore network errors */
  }
}

checkForUpdate();
setInterval(checkForUpdate, 5 * 60 * 1000);
