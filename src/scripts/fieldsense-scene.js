import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildFarm, parcels } from "./fieldsense-farm.js";

export function createScene(root, selectField, fallback) {
  const viewport = root.querySelector("#fs-viewport");
  const host = viewport.querySelector(".fs-scene-host");
  const toolbar = root.querySelector(".fs-camera");
  const key = root.querySelector(".fs-soil-key");
  const cutButton = toolbar.querySelector('[data-camera="cut"]');
  const touchButton = toolbar.querySelector('[data-camera="touch"]');
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  const canvas = renderer.domElement;
  const world = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  const abort = new AbortController();
  const on = (target, event, fn) =>
    target.addEventListener(event, fn, { signal: abort.signal });
  let sizeObserver,
    visibilityObserver,
    visible = true,
    disposed = false;
  let raf = 0,
    tween,
    view = "overview",
    record,
    fields,
    labels,
    touch = false;
  const coarse = matchMedia("(pointer:coarse)");
  const target = new T.Vector3();
  const direction = new T.Vector3();
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  let down;
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    abort.abort();
    sizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    controls.dispose();
    const textures = new Set(),
      materials = new Set(),
      geometries = new Set();
    world.traverse((obj) => {
      if (obj.geometry) geometries.add(obj.geometry);
      if (obj.material)
        for (const m of [].concat(obj.material)) materials.add(m);
      if (obj.isInstancedMesh) obj.dispose();
    });
    materials.forEach((m) => {
      Object.values(m).forEach((v) => {
        if (v?.isTexture) textures.add(v);
      });
      m.dispose();
    });
    textures.forEach((t) => t.dispose());
    geometries.forEach((g) => g.dispose());
    renderer.dispose();
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
    host.replaceChildren();
    delete viewport.dataset.view;
  }
  function cancelTween() {
    tween = null;
  }
  function schedule() {
    if (!disposed && visible && !document.hidden && record?.feasible && !raf)
      raf = requestAnimationFrame(draw);
  }
  function pose(next, instant = false) {
    view = next;
    viewport.dataset.view = view;
    const p = parcels[record.field];
    const narrow = Math.max(1, 1.33 / camera.aspect);
    const dest =
      view === "overview"
        ? new T.Vector3(0, -0.45, 0)
        : new T.Vector3(
            p.x + (view === "cut" ? 0.65 : 0),
            view === "cut" ? 0.82 : 0.42,
            p.z + (view === "cut" ? p.d * 0.26 : 0),
          );
    const offset =
      view === "overview"
        ? new T.Vector3(8.3, 10.4, 12.5)
        : view === "cut"
          ? new T.Vector3(3.85, 1.9, 4.7)
          : new T.Vector3(4.6, 3.3, 6.1);
    const end = dest.clone().addScaledVector(offset, narrow);
    cancelTween();
    if (instant || record.reduced) {
      controls.target.copy(dest);
      camera.position.copy(end);
      controls.update();
    } else {
      tween = {
        start: performance.now(),
        from: camera.position.clone(),
        to: end,
        fromTarget: controls.target.clone(),
        toTarget: dest,
      };
    }
    syncFields();
    schedule();
  }
  function syncFields() {
    const cut = view === "cut" && record.feasible;
    cutButton.setAttribute("aria-pressed", String(cut));
    cutButton.textContent = cut ? "Close soil cutaway" : "Show soil cutaway";
    key.hidden = !cut;
    if (cut)
      key.querySelector("strong").textContent =
        record.fields[record.field].event.ending_moisture_mm + " mm";
    fields.forEach((f, i) => {
      const data = record.fields[i];
      f.update(
        data?.event,
        cut && record.field === i,
        record.field === i && view !== "overview",
      );
      labels[i].textContent = data
        ? cut && i === record.field
          ? data.name + " \u00b7 " + data.event.ending_moisture_mm + " mm"
          : data.name
        : "";
      labels[i].hidden = !data || (view !== "overview" && i !== record.field);
    });
  }
  function paint(time) {
    if (tween) {
      const t = Math.min(1, Math.max(0, (time - tween.start) / 350));
      const k = t * t * (3 - 2 * t);
      camera.position.lerpVectors(tween.from, tween.to, k);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
      controls.update();
      if (t === 1) cancelTween();
    }
    const moving = record.playing && !record.reduced;
    const occupied = [];
    fields.forEach((f, i) => {
      f.animate(moving ? time / 1000 : 0);
      if (labels[i].hidden) return;
      const p = parcels[i];
      target
        .set(p.x, view === "cut" ? 1.72 : 1.65, p.z - p.d * 0.25)
        .project(camera);
      const x = ((target.x + 1) * host.clientWidth) / 2,
        y = ((1 - target.y) * host.clientHeight) / 2;
      const half = labels[i].offsetWidth / 2 + 3;
      const left = T.MathUtils.clamp(x, half, host.clientWidth - half);
      let top = T.MathUtils.clamp(y, 27, host.clientHeight - 18);
      for (const placed of occupied) {
        if (
          Math.abs(left - placed.left) < half + placed.half &&
          Math.abs(top - placed.top) < 24
        )
          top = placed.top + 25;
      }
      occupied.push({ left, half, top });
      labels[i].style.left = left + "px";
      labels[i].style.top = top + "px";
      labels[i].style.visibility =
        target.z > 1 ||
        target.z < -1 ||
        Math.abs(target.x) > 1.08 ||
        Math.abs(target.y) > 1
          ? "hidden"
          : "";
    });
    renderer.render(world, camera);
    if (
      tween ||
      (moving &&
        record.fields.some((f) => f.event.irrigation_mm || f.event.rain_mm))
    )
      schedule();
  }
  function draw(time) {
    raf = 0;
    if (!record?.feasible || !visible || document.hidden || disposed) return;
    try {
      paint(time);
    } catch {
      fallback();
    }
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 550 ? 1.25 : 1.5));
    renderer.setSize(w, h, false);
    if (record?.feasible) pose(view, true);
  }
  function inputMode() {
    controls.enabled = !coarse.matches || touch;
    canvas.style.touchAction = controls.enabled ? "none" : "pan-y pinch-zoom";
    touchButton.setAttribute("aria-pressed", String(touch));
    touchButton.textContent = touch ? "Done" : "Explore in 3D";
  }
  function update(next, reason) {
    record = next;
    if (!next.feasible) {
      cancelTween();
      cancelAnimationFrame(raf);
      raf = 0;
      touch = false;
      inputMode();
      syncFields();
      return;
    }
    if (reason === "initial" || reason === "scenario") pose("overview", true);
    else if (reason === "focus") pose(view === "cut" ? "cut" : "field");
    else {
      if (next.reduced && tween) pose(view, true);
      syncFields();
    }
    if (viewport.dataset.renderer !== "3d") {
      paint(performance.now());
      viewport.dataset.renderer = "3d";
      toolbar.hidden = false;
    }
    schedule();
  }

  try {
    host.append(canvas);
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 36;
    controls.minPolarAngle = 0.32;
    controls.maxPolarAngle = Math.PI * 0.435;
    controls.minAzimuthAngle = -1.25;
    controls.maxAzimuthAngle = 1.52;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.75;
    world.add(new T.HemisphereLight(0xfff3d8, 0x839781, 1.8));
    const sun = new T.DirectionalLight(0xffdda5, 2.35);
    sun.position.set(-5, 9, 3);
    world.add(sun);
    fields = buildFarm(world);
    labels = fields.map(() => {
      const tag = document.createElement("span");
      tag.className = "fs-field-tag";
      host.append(tag);
      return tag;
    });
    inputMode();
    resize();
    controls.addEventListener("change", schedule);
    controls.addEventListener("start", cancelTween);
    on(coarse, "change", inputMode);
    on(canvas, "webglcontextlost", (e) => {
      e.preventDefault();
      fallback();
    });
    on(canvas, "pointerdown", (e) => {
      down = [e.clientX, e.clientY];
    });
    on(canvas, "pointercancel", () => {
      down = null;
    });
    on(canvas, "pointerup", (e) => {
      if (
        !down ||
        e.button !== 0 ||
        Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5
      )
        return;
      down = null;
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
        1 - ((e.clientY - bounds.top) / bounds.height) * 2,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(
        fields.flatMap((f) => [f.ground, f.wedge]).filter((m) => m.visible),
        false,
      )[0];
      if (hit)
        selectField(
          fields.findIndex(
            (f) => f.ground === hit.object || f.wedge === hit.object,
          ),
        );
    });
    on(toolbar, "click", (e) => {
      const action = e.target.closest("button")?.dataset.camera;
      if (!action || !record?.feasible) return;
      if (action === "touch") {
        touch = !touch;
        inputMode();
        return;
      }
      if (action === "overview" || action === "cut") {
        pose(
          action === "overview" ? "overview" : view === "cut" ? "field" : "cut",
        );
        return;
      }
      cancelTween();
      direction.subVectors(camera.position, controls.target);
      if (action === "left" || action === "right")
        direction.applyAxisAngle(
          new T.Vector3(0, 1, 0),
          action === "left" ? -0.25 : 0.25,
        );
      else direction.multiplyScalar(action === "in" ? 0.82 : 1.22);
      camera.position.copy(controls.target).add(direction);
      controls.update();
      schedule();
    });
    sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    visibilityObserver.observe(viewport);
    on(document, "visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else schedule();
    });
    return { update, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
