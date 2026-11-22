const root = document.querySelector("#fieldsense-app");
const viewport = root.querySelector("#fs-viewport");

// Keep the fully working SVG until the GPU has produced its first frame.
function mount() {
  let closed = false;
  let loading = false;
  let scene;
  let unsubscribe;
  const intersection = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) load();
    },
    { rootMargin: "160px" },
  );

  function release(event) {
    if (closed) return;
    const returnFocus = root
      .querySelector(".fs-camera")
      .contains(document.activeElement);
    closed = true;
    intersection.disconnect();
    root.removeEventListener("fieldsense-ready", load);
    unsubscribe?.();
    scene?.dispose();
    viewport.dataset.renderer = "svg";
    root.querySelector(".fs-camera").hidden = true;
    root.querySelector(".fs-soil-key").hidden = true;
    if (event?.type !== "pagehide") {
      root.querySelector(".fs-fallback-note").hidden = false;
      if (returnFocus)
        root
          .querySelector("button[data-field][aria-pressed=true]")
          ?.focus({ preventScroll: true });
    }
  }

  async function load() {
    if (closed || loading || !root.fieldsenseReplay) return;
    if (
      viewport.getBoundingClientRect().top > innerHeight + 160 ||
      !viewport.clientWidth
    )
      return;
    loading = true;
    try {
      const { createScene } = await import("./fieldsense-scene.js");
      if (closed) return;
      scene = createScene(root, root.fieldsenseReplay.selectField, release);
      unsubscribe = root.fieldsenseReplay.subscribe((record, reason) => {
        if (closed) return;
        try {
          scene.update(record, reason);
        } catch {
          release();
        }
      });
      if (closed) unsubscribe();
      else root.querySelector(".fs-fallback-note").hidden = true;
      intersection.disconnect();
    } catch {
      release();
    }
  }
  intersection.observe(viewport);
  root.addEventListener("fieldsense-ready", load);
  window.addEventListener("pagehide", release, { once: true });
}
mount();
window.addEventListener("pageshow", (e) => {
  if (e.persisted) mount();
});
