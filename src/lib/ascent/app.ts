import { lessons, problems, tracks, labs } from "./data";
import {
  fresh,
  day,
  reward,
  schedule,
  mastery,
  effectiveLevel,
  streak,
  grade,
  readiness,
  parseProgress,
  type Progress,
} from "./engine";
import { IndexedStore } from "./store";
import { PyodideRunner, type RunResult } from "./runner";
import type { Exercise, Lesson } from "./schema";
import katex from "katex";
import "katex/dist/katex.min.css";

const mountain =
  '<svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><path d="M5 85 47 20 65 48 81 8 117 85Z" stroke="currentColor"/><path d="m33 42 14-22 18 28 16-40 12 27M5 85h112M47 20l10 65M81 8l-5 77" stroke="currentColor"/></svg>';
const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const link = (to: string, label: string, primary = false) =>
  `<a class="btn ${primary ? "primary" : ""}" href="#${to}">${label}</a>`;
let p: Progress = fresh();
const store = new IndexedStore();
const runner = new PyodideRunner();
let storage = true;
let root: HTMLElement;
let cleanup = () => {};
let routeToken = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let editor: { value: () => string; dispose: () => void } | undefined;
let session:
  | {
      lesson: Lesson;
      queue: Exercise[];
      position: number;
      correct: number;
      misses: number;
      boss: boolean;
      placement: boolean;
      review?: boolean;
      start: number;
      seen: Set<string>;
    }
  | undefined;
let mock:
  | {
      mode: string;
      started: number;
      end: number;
      phaseStarted: number;
      phase: string;
      phases: Record<string, number>;
      attempts: { problem: string; passed: boolean; elapsed: number }[];
    }
  | undefined;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
function on(selector: string, event: string, handler: (e: Event) => void) {
  root
    .querySelectorAll(selector)
    .forEach((n) => n.addEventListener(event, handler));
}
function toast(message: string) {
  root.querySelector(".toast")?.remove();
  const div = document.createElement("div");
  div.className = "toast";
  div.role = "status";
  div.textContent = message;
  root.append(div);
  setTimeout(() => div.remove(), 6000);
}
async function save() {
  try {
    await store.save(p);
  } catch {
    storage = false;
    toast("Browser storage unavailable. Export your progress before closing.");
  }
}
function shell(active: string, html: string) {
  cleanup();
  cleanup = () => {};
  runner.terminate();
  editor?.dispose();
  editor = undefined;
  clearInterval(timer);
  root.innerHTML = `<aside class="sidebar"><a class="app-brand" href="#home">${mountain}Ascent<span style="color:var(--accent)">.</span></a><small>THE LEARNING WORKSPACE</small><nav class="app-nav" aria-label="Ascent navigation">${[
    ["home", "⌂", "Overview"],
    ["learn", "⌘", "Learning path"],
    ["practice", "〈〉", "Practice"],
    ["review", "↻", "Daily review"],
    ["interview", "◷", "Interview studio"],
    ["readiness", "◇", "Readiness"],
    ["radar", "↗", "Field Radar"],
    ["settings", "⚙", "Your progress"],
  ]
    .map(
      ([id, icon, title]) =>
        `<a href="#${id}" class="${active === id ? "active" : ""}" ${active === id ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${title}</a>`,
    )
    .join(
      "",
    )}</nav><div class="side-foot"><div class="eyebrow">SMALL STEPS. DEEP UNDERSTANDING.</div><p>Build the foundations.<br>Then build it from scratch.</p><a href="https://github.com/jacobhroutzong/portfolio-website" target="_blank" rel="noopener noreferrer">Source on GitHub ↗</a></div></aside><section class="workspace"><div class="topline"><span>ASCENT / ${esc(active.toUpperCase())}</span><span class="local-dot">${storage ? "LOCAL-FIRST · NO ACCOUNT" : "STORAGE UNAVAILABLE · EXPORT TO SAVE"}</span></div><div id="view">${html}</div></section>`;
}
function heading(
  eyebrow: string,
  title: string,
  description: string,
  extra = "",
) {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;
}
function due() {
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= day())
    .slice(0, Math.min(12, Math.max(3, Math.floor(p.goal / 10))));
}
function radar() {
  const cx = 130,
    cy = 117,
    r = 76,
    n = 13;
  const point = (i: number, d: number) =>
    `${cx + Math.sin((i / n) * 2 * Math.PI) * d},${cy - Math.cos((i / n) * 2 * Math.PI) * d}`;
  return `<svg class="radar" viewBox="0 0 260 250" role="img" aria-label="Mastery across 13 tracks, level zero through five">${[0.25, 0.5, 0.75, 1].map((scale) => `<polygon points="${tracks.map((_, i) => point(i, r * scale)).join(" ")}" stroke="var(--border-strong)" fill="none" stroke-width=".7"/>`).join("")}${tracks.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${point(i, r).split(",")[0]}" y2="${point(i, r).split(",")[1]}" stroke="var(--border)"/><text x="${point(i, r + 18).split(",")[0]}" y="${point(i, r + 18).split(",")[1]}" text-anchor="middle" fill="var(--muted)" font-size="8">${String(i).padStart(2, "0")}</text>`).join("")}<polygon points="${tracks.map((t, i) => point(i, Math.max(2, (effectiveLevel(p.skills[String(t.id)]) / 5) * r))).join(" ")}" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.5"/><text x="130" y="244" text-anchor="middle" fill="var(--muted)" font-size="9">TRACK MASTERY · 0—5</text></svg>`;
}
function home() {
  const today = p.days[day()] ?? 0;
  const next = lessons.find((l) => !p.completed.includes(l.id)) ?? lessons[0];
  const complete = p.submissions.filter((s) => s.passed);
  shell(
    "home",
    heading(
      "A LITTLE FURTHER, EVERY DAY",
      "Your next step starts here.",
      "A focused session. One concept, one recall, one problem.",
      `<span class="pill">${day()} · YOUR WORKSPACE</span>`,
    ) +
      `<div class="stats"><div class="metric"><strong>${streak(p)}<span style="display:inline;font:13px Arial"> days</span></strong><span>Current learning streak</span></div><div class="metric"><strong>${p.xp.toLocaleString()}</strong><span>Total experience earned</span></div><div class="metric"><strong>${p.completed.filter((id) => !id.startsWith("boss")).length}<span style="display:inline;font:13px Arial"> / ${lessons.length}</span></strong><span>Lessons completed</span></div><div class="metric"><strong>${new Set(complete.map((s) => s.problem)).size}<span style="display:inline;font:13px Arial"> / ${problems.length}</span></strong><span>Practice problems solved</span></div></div><div class="dashboard"><div>${!p.placement ? `<article class="panel feature"><div class="eyebrow">FIND YOUR STARTING POINT</div><h2>Start where you are.</h2><p>A 20-question placement check finds foundations to revisit. Or begin with the first lesson.</p><div class="actions">${link("placement", "Find my starting point →", true)}${link("learn", "Explore the path")}</div><div class="mountain">${mountain}</div></article>` : ""}<article class="panel"><div class="panel-top"><h2>Today’s plan</h2><span class="subtle">~30 MIN · AT YOUR PACE</span></div>${[
        [`lesson/${next.id}`, "01", next.title, "LEARN · 6–10 MIN"],
        [
          "review",
          "02",
          "Make it stick",
          `${due().length} DUE · SPACED REVIEW`,
        ],
        [
          `problem/${problems.find((pr) => !complete.some((s) => s.problem === pr.id))?.id ?? "first-repeat"}`,
          "03",
          "Put it into practice",
          "CODE · 20 MIN",
        ],
      ]
        .map(
          ([to, num, title, meta]) =>
            `<div class="plan-item"><span class="step">${num}</span><div class="copy"><h3>${title}</h3><p>${meta}</p></div><a href="#${to}" aria-label="Open ${title}">↗</a></div>`,
        )
        .join(
          "",
        )}</article><article class="panel feature"><div class="eyebrow">THE BIGGER PICTURE</div><h2>Understanding you can build on.</h2><p>13 tracks, from your first tested function to implementing attention. Master the foundations; unlock what follows.</p>${link("learn", "View the learning path →")}<div class="mountain">${mountain}</div></article>${today >= p.goal ? '<div class="notice">You’ve reached your goal. You’ve done enough today; take a break whenever you’re ready.</div>' : ""}</div><aside><article class="panel"><div class="panel-top"><h2>Daily intention</h2><span class="pill">${Math.min(100, Math.round((today / p.goal) * 100))}%</span></div><div class="goal"><svg class="goal-ring" viewBox="0 0 70 70" aria-label="Daily XP goal"><circle cx="35" cy="35" r="29" fill="none" stroke="var(--border)" stroke-width="5"/><circle cx="35" cy="35" r="29" fill="none" stroke="var(--accent)" stroke-width="5" stroke-dasharray="${Math.min(1, today / p.goal) * 182.2} 182.2"/></svg><div><h3>${today} / ${p.goal} XP</h3><p style="margin:0">Consistency over intensity.</p></div></div><div class="week">${Array.from(
        { length: 7 },
        (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - 6 + i);
          return `<span class="day ${p.days[day(d)] ? "done" : ""}" title="${day(d)}: ${p.days[day(d)] ?? 0} XP">${["S", "M", "T", "W", "T", "F", "S"][d.getDay()]}</span>`;
        },
      ).join(
        "",
      )}</div></article><article class="panel"><div class="panel-top"><h2>Your skill landscape</h2><span class="subtle">13 TRACKS</span></div>${radar()}<p>Starts empty. Every point is earned through spaced practice.</p>${link("readiness", "Explore your readiness →")}</article><article class="panel"><div class="eyebrow">NEXT CHECKPOINT</div><h3>Foundations boss</h3><p>Three questions. Five minutes. Recall the basics without hints.</p>${link("boss/0", "View checkpoint →")}</article></aside></div>`,
  );
}
function unlocked(track: number) {
  if (track === 0 || track === 12) return true;
  return tracks[track].prerequisites.every(
    (t) => effectiveLevel(p.skills[String(t)]) >= 1 && p.bosses.includes(t),
  );
}
function learn() {
  shell(
    "learn",
    heading(
      "A PATH, NOT A RACE",
      "Build from the ground up.",
      "Learn a concept. Retrieve it. Make something that works.",
    ) +
      tracks
        .map((t) => {
          const ls = lessons.filter((l) => l.track === t.id);
          const available = ls.length > 0 && unlocked(t.id);
          return `<article class="track"><div class="track-num">${String(t.id).padStart(2, "0")}</div><div><h2>${t.title}</h2><p>${t.description}</p><span class="subtle">CAPSTONE · ${t.capstone}</span>${ls.length ? `<div class="lesson-list">${ls.map((l) => (available ? `<a class="lesson-link" href="#lesson/${l.id}"><span>${p.completed.includes(l.id) ? "✓ " : ""}${l.title}</span><span>6 exercises ↗</span></a>` : `<div class="lesson-link"><span>${l.title}</span><span>Locked</span></div>`)).join("")}${available ? link(`boss/${t.id}`, p.bosses.includes(t.id) ? "✓ Checkpoint passed · retry" : "Boss checkpoint →") : ""}</div>` : `<ul class="outline">${t.units.map((u) => `<li>${u}</li>`).join("")}</ul>${t.id === 12 ? link("interview", "Open interview studio →") : "<p>Coming soon · outline only</p>"}`}</div><span class="pill">${ls.length ? (available ? "AVAILABLE" : "PREREQUISITES NEEDED") : "OUTLINED"}</span></article>`;
        })
        .join(""),
  );
}
function startLesson(id: string, boss = false) {
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return missing();
  if (!unlocked(lesson.track)) return locked(lesson.track);
  const all = lessons.filter((l) => l.track === lesson.track);
  if (boss && !all.every((l) => p.completed.includes(l.id))) {
    shell(
      "learn",
      heading(
        "CHECKPOINT",
        "Finish the lessons first.",
        "Complete the lessons in this track before the timed boss.",
      ) + link("learn", "Back to learning path"),
    );
    return;
  }
  const queue = boss
    ? all
        .flatMap((l) => l.exercises)
        .filter(
          (e) => !["free", "fill", "coding", "multipart"].includes(e.type),
        )
        .slice(-3)
    : [...lesson.exercises];
  session = {
    lesson,
    queue,
    position: 0,
    correct: 0,
    misses: 0,
    boss,
    placement: false,
    start: Date.now(),
    seen: new Set(),
  };
  if (boss) return exercise();
  shell(
    "learn",
    `<div class="exercise-shell">${heading(`TRACK ${String(lesson.track).padStart(2, "0")} · CONCEPT`, esc(lesson.title), esc(lesson.objective))}<article class="concept"><p>${esc(lesson.concept)}</p>${lesson.equation ? katex.renderToString(lesson.equation, { throwOnError: false, displayMode: true }) : ""}</article><p class="subtle">6 exercises · retrieval before answers · mistakes come back for another try</p><p><a class="source" target="_blank" rel="noopener noreferrer" href="${lesson.source}">Read the primary source ↗</a></p><div class="actions"><button class="btn primary" id="begin">Let’s begin →</button>${link("learn", "Back to the path")}</div></div>`,
  );
  on("#begin", "click", exercise);
}
function exercise() {
  if (!session) return;
  const s = session;
  const e = s.queue[s.position];
  if (!e) return finishLesson();
  let selected: string[] = [];
  let ordered: string[] = [];
  let submitted = false;
  let stage = 0;
  const remaining = s.boss
    ? Math.max(0, 300 - Math.floor((Date.now() - s.start) / 1000))
    : 0;
  const input = ["choice", "bug", "multi"].includes(e.type)
    ? e.options
        ?.map(
          (o) =>
            `<button class="option" data-option="${esc(o)}" aria-pressed="false">${esc(o)}</button>`,
        )
        .join("") +
      (e.type === "bug" && e.code
        ? `<pre>${esc(e.code)}</pre><textarea id="answer" rows="6" aria-label="Corrected Python code">${esc(e.code)}</textarea>`
        : "")
    : e.type === "ordering"
      ? `<p class="subtle">Choose steps in order. Click Reset to start over.</p><div id="order" aria-live="polite"></div>${e.options?.map((o) => `<button class="option" data-order="${esc(o)}">${esc(o)}</button>`).join("")}<button class="btn" id="reset-order">Reset order</button>`
      : e.type === "free"
        ? '<textarea id="answer" rows="5" aria-label="Your explanation" placeholder="Explain it in your own words…"></textarea>'
        : e.code
          ? `<pre>${esc(e.code)}</pre><textarea id="answer" rows="6" aria-label="Python answer">${esc(e.type === "fill" ? e.code.replace("# replace this line", "pass") : e.code)}</textarea>`
          : `<label class="subtle" for="answer">${e.type === "shape" ? "Enter a shape, e.g. (2,4)" : e.type === "estimation" ? `Numeric estimate · tolerance ±${(e.tolerance ?? 0) * 100}%` : "Your answer"}</label><input class="answer-input" id="answer" autocomplete="off"/>`;
  shell(
    s.placement ? "home" : "learn",
    `<div class="exercise-shell">${heading(s.placement ? "PLACEMENT · ADAPTS TO YOUR ANSWERS" : s.boss ? "BOSS CHECKPOINT · NO HINTS" : esc(s.lesson.title), s.placement ? "Find your footing." : s.boss ? "Show what you remember." : "A little practice, a lasting idea.", `Question ${s.position + 1} of ${s.queue.length}`)}${s.boss ? `<div class="timer" id="boss-time">${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}</div>` : ""}<div class="progress-bar"><span style="width:${(s.position / s.queue.length) * 100}%"></span></div><h2 style="font-size:25px;margin-top:30px">${esc(e.prompt)}</h2>${input}<div id="feedback" aria-live="polite"></div><div class="actions" style="margin-top:25px"><button class="btn primary" id="check">${e.type === "free" ? "Compare with rubric" : "Check answer"}</button><button class="btn" id="next" hidden>Continue →</button>${link("learn", "Leave session")}</div>${!s.boss && !s.placement ? `<details><summary>Revisit the concept</summary><p>${esc(s.lesson.concept)}</p></details>` : ""}</div>`,
  );
  if (s.boss) {
    timer = setInterval(() => {
      const left = Math.max(0, 300 - Math.floor((Date.now() - s.start) / 1000));
      const el = $("#boss-time");
      if (el)
        el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (!left) {
        s.misses++;
        finishLesson();
      }
    }, 1000);
  }
  on("[data-option]", "click", (ev) => {
    if (submitted) return;
    const el = ev.currentTarget as HTMLButtonElement;
    const value = el.dataset.option!;
    if (e.type === "multi") {
      selected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
    } else selected = [value];
    root.querySelectorAll<HTMLButtonElement>("[data-option]").forEach((b) => {
      const active = selected.includes(b.dataset.option!);
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", String(active));
    });
  });
  on("[data-order]", "click", (ev) => {
    if (submitted) return;
    const el = ev.currentTarget as HTMLButtonElement;
    ordered.push(el.dataset.order!);
    el.disabled = true;
    $("#order").textContent = ordered.join(" → ");
  });
  on("#reset-order", "click", () => {
    if (submitted) return;
    ordered = [];
    $("#order").textContent = "";
    root
      .querySelectorAll<HTMLButtonElement>("[data-order]")
      .forEach((b) => (b.disabled = false));
  });
  const resolveAnswer = async (correct: boolean) => {
    submitted = true;
    const skill = String(
      lessons.find((l) => l.exercises.some((item) => item.id === e.id))
        ?.track ?? s.lesson.track,
    );
    if (!s.boss && !s.placement) {
      p.skills[skill] = mastery(p.skills[skill], correct);
      p.cards[e.id] = schedule(p.cards[e.id], correct ? 4 : 1);
      if (correct && !s.seen.has(e.id)) {
        reward(p, 5);
        s.seen.add(e.id);
      }
    }
    if (correct) s.correct++;
    else {
      s.misses++;
      if (
        !s.boss &&
        !s.placement &&
        s.queue.filter((q) => q.id === e.id).length < 3
      )
        s.queue.push(e);
    }
    $("#feedback").innerHTML =
      `<div class="feedback ${correct ? "" : "bad"}"><strong>${correct ? "That’s right." : "Keep this one in mind."}</strong> ${esc(e.explanation)}${!correct && !s.boss && !s.placement ? '<p>Name the mistake to guide your reviews.</p><label> Mistake type <select id="mistake"><option value="">Choose a type</option><option>Concept gap</option><option>Careless slip</option><option>Misread</option><option>Edge case</option></select></label>' : ""}</div>`;
    if (!correct && !s.boss && !s.placement) {
      on("#mistake", "change", () => {
        const v = $<HTMLSelectElement>("#mistake").value;
        if (v) {
          p.mistakes[v] = (p.mistakes[v] ?? 0) + 1;
          void save();
          $<HTMLButtonElement>("#next").disabled = false;
        }
      });
      $<HTMLButtonElement>("#next").disabled = true;
    }
    $("#check").hidden = true;
    $("#next").hidden = false;
    if (correct || s.boss || s.placement) $("#next").focus();
    await save();
  };
  on("#check", "click", async () => {
    if (submitted) return;
    const value = $<HTMLInputElement>("#answer")?.value ?? "";
    if (!selected.length && !ordered.length && !value.trim()) {
      toast("Try an answer first.");
      return;
    }
    if (e.type === "free") {
      if (value.trim().length < 15) {
        toast("Write a little more before comparing.");
        return;
      }
      submitted = true;
      $("#feedback").innerHTML =
        `<div class="feedback"><h3>Self-assessment rubric</h3><ul class="rubric">${e.rubric?.map((r) => `<li>${esc(r)}</li>`).join("")}</ul><p>Advisory self-assessment; no model grading.</p><div class="actions"><button class="btn" id="again">Needs another try</button><button class="btn primary" id="good">Meets the rubric</button></div></div>`;
      $("#check").hidden = true;
      on("#again", "click", () => void resolveAnswer(false));
      on("#good", "click", () => void resolveAnswer(true));
      return;
    }
    if (e.code && e.tests) {
      const button = $<HTMLButtonElement>("#check");
      button.disabled = true;
      button.textContent = "Starting Python…";
      if (e.type === "bug" && !grade(e, selected[0] ?? "")) {
        button.disabled = false;
        button.textContent = "Check answer";
        await resolveAnswer(false);
        return;
      }
      const result = await runner.run(
        value,
        e.stages
          ? e.stages.slice(0, stage + 1).flatMap((part) => part.tests)
          : [e.tests],
      );
      if (
        session !== s ||
        s.queue[s.position] !== e ||
        !root.querySelector("#check")
      )
        return;
      button.disabled = false;
      button.textContent = "Check answer";
      if (result.error) {
        toast(result.error);
        return;
      }
      if (e.stages && result.passed && stage < e.stages.length - 1) {
        stage++;
        $("#feedback").innerHTML =
          `<div class="feedback"><strong>Part ${stage} passed.</strong><p>${esc(e.stages[stage].prompt)}</p></div>`;
        return;
      }
      if (e.stages && !result.passed) {
        $("#feedback").innerHTML = renderResult(result);
        return;
      }
      await resolveAnswer(result.passed);
      return;
    }
    await resolveAnswer(
      grade(
        e,
        e.type === "ordering"
          ? ordered
          : e.type === "multi"
            ? selected
            : selected.length
              ? selected[0]
              : value,
      ),
    );
  });
  on("#next", "click", () => {
    s.position++;
    if (s.placement && s.position < 20) {
      const level = s.correct / Math.max(1, s.position);
      const pool = lessons
        .filter((l) =>
          level > 0.7 ? l.track >= 3 : level < 0.4 ? l.track === 0 : true,
        )
        .flatMap((l) => l.exercises.map((e) => ({ e, l })))
        .filter(
          ({ e }) =>
            !s.queue.slice(0, s.position).some((q) => q.id === e.id) &&
            !["free", "fill", "coding", "multipart", "ordering"].includes(
              e.type,
            ),
        );
      if (pool.length) {
        const item = pool[s.position % pool.length];
        s.queue[s.position] = item.e;
        s.lesson = item.l;
      }
    }
    exercise();
  });
}
function finishLesson() {
  if (!session) return;
  const s = session;
  clearInterval(timer);
  const passed = s.boss
    ? s.misses === 0 && s.position >= s.queue.length
    : !s.placement;
  let message = "";
  if (s.placement) {
    p.placement = true;
    message = `You answered ${s.correct} of 20 correctly. This placement highlights a starting point; mastery and boss checkpoints still require demonstrated practice.`;
  } else if (s.boss) {
    if (passed && !p.bosses.includes(s.lesson.track)) {
      p.bosses.push(s.lesson.track);
      reward(p, 30);
    }
    message = passed
      ? "Checkpoint cleared. The next prerequisite-based track is now available."
      : "Review the concepts, then try the checkpoint again. All three answers must pass within five minutes.";
  } else if (s.review) {
    message = "Review complete. Your next retrieval dates have been updated.";
  } else {
    if (!p.completed.includes(s.lesson.id)) {
      p.completed.push(s.lesson.id);
      reward(p, 20);
    }
    message =
      "Your next review is scheduled. Come back after a gap to strengthen mastery.";
  }
  void save();
  shell(
    "learn",
    heading(
      s.placement
        ? "PLACEMENT COMPLETE"
        : s.boss
          ? "CHECKPOINT RESULT"
          : "SESSION COMPLETE",
      s.placement
        ? "A starting point, not a label."
        : s.boss
          ? passed
            ? "A foundation worth building on."
            : "A useful gap to work on."
          : "One step further.",
      message,
    ) +
      `<article class="panel"><h2>${s.correct} correct · ${s.misses} to revisit</h2><p>${esc(s.lesson.recap)}</p>${link("learn", "Back to the learning path →", true)} ${link("home", "Overview")}</article>`,
  );
  session = undefined;
}
function placement() {
  const pool = lessons
    .flatMap((l) => l.exercises)
    .filter(
      (e) =>
        !["free", "fill", "coding", "multipart", "ordering"].includes(e.type),
    );
  session = {
    lesson: lessons[0],
    queue: pool.slice(0, 20),
    position: 0,
    correct: 0,
    misses: 0,
    boss: false,
    placement: true,
    start: Date.now(),
    seen: new Set(),
  };
  exercise();
}
function review() {
  const cards = due();
  if (!cards.length) {
    shell(
      "review",
      heading(
        "SPACED RETRIEVAL",
        "A clear review queue.",
        "New reviews appear after your first lesson. Nothing is overdue today.",
      ) + link("learn", "Learn something new →", true),
    );
    return;
  }
  const exercises = cards
    .map(([id]) => lessons.flatMap((l) => l.exercises).find((e) => e.id === id))
    .filter((e): e is Exercise => !!e);
  const problemCards = cards.filter(([id]) => id.startsWith("problem:"));
  if (!exercises.length) {
    shell(
      "review",
      heading(
        "SPACED PRACTICE",
        "Rebuild it from memory.",
        "These problems are due after a miss or a hint. Try them without looking at your earlier solution.",
      ) +
        problemCards
          .map(([id]) => {
            const pr = problems.find((item) => "problem:" + item.id === id);
            return pr
              ? `<article class="panel"><h2>${esc(pr.title)}</h2>${link("problem/" + pr.id, "Open problem →", true)}</article>`
              : "";
          })
          .join(""),
    );
    return;
  }
  const lesson = lessons.find((l) =>
    l.exercises.some((e) => e.id === exercises[0]?.id),
  )!;
  session = {
    lesson,
    queue: exercises,
    position: 0,
    correct: 0,
    misses: 0,
    boss: false,
    placement: false,
    review: true,
    start: Date.now(),
    seen: new Set(),
  };
  exercise();
}
function practice() {
  shell(
    "practice",
    heading(
      "KNOW IT. BUILD IT.",
      "The practice bench.",
      "Original problems. Real Python. Tests that make you think.",
    ) +
      `<div class="filters"><label>Topic<select id="topic" aria-label="Topic"><option value="">All topics</option>${[...new Set(problems.map((pr) => pr.topic))].map((t) => `<option>${t}</option>`).join("")}</select></label><label>Difficulty<select id="difficulty" aria-label="Difficulty"><option value="">All levels</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">Level ${n}</option>`).join("")}</select></label><label>Study emphasis<select id="lab" aria-label="Study emphasis"><option value="">All profiles</option>${labs.map((l) => `<option>${l.name}</option>`).join("")}</select></label><label>Status<select id="status" aria-label="Status"><option value="">All problems</option><option value="solved">Solved</option><option value="attempted">Attempted</option><option value="new">Not attempted</option></select></label></div><p class="subtle">Lab profiles suggest study emphasis; these are original exercises, not reported company questions.</p><div id="problem-list"></div>`,
  );
  const filter = () => {
    const topic = $<HTMLSelectElement>("#topic").value,
      difficulty = $<HTMLSelectElement>("#difficulty").value,
      status = $<HTMLSelectElement>("#status").value,
      lab = $<HTMLSelectElement>("#lab").value;
    const list = problems.filter((pr) => {
      const submissions = p.submissions.filter((s) => s.problem === pr.id);
      const solved = submissions.some((s) => s.passed);
      const relevant =
        lab === "" ||
        lab === "General" ||
        (labs.find((l) => l.name === lab)?.weights[pr.track] ?? 0) >= 2;
      return (
        (!topic || pr.topic === topic) &&
        (!difficulty || pr.difficulty === Number(difficulty)) &&
        relevant &&
        (!status ||
          (status === "solved"
            ? solved
            : status === "attempted"
              ? submissions.length && !solved
              : !submissions.length))
      );
    });
    $("#problem-list").innerHTML =
      `<p class="subtle" role="status">${list.length} problems</p>${list.length ? list.map((pr) => `<a class="problem-row" href="#problem/${pr.id}"><span class="check">${p.submissions.some((s) => s.problem === pr.id && s.passed) ? "✓" : "·"}</span><span><strong>${esc(pr.title)}</strong><small>${pr.topic}</small></span><span>Level ${pr.difficulty}</span><span>${pr.minutes} min ↗</span></a>`).join("") : '<div class="panel"><h3>No matches</h3><p>Change a filter to see more problems.</p></div>'}`;
  };
  on("select", "change", filter);
  filter();
}
async function problemPage(id: string) {
  const pr = problems.find((pr) => pr.id === id);
  if (!pr) return missing();
  const token = routeToken;
  let code = p.drafts[id] ?? pr.starter;
  let hinted = false;
  let hint = 0;
  let busy = false;
  let plain = false;
  let reference = "";
  const opened = Date.now();
  shell(
    "practice",
    heading(
      `PRACTICE / ${esc(pr.topic.toUpperCase())}`,
      esc(pr.title),
      `Level ${pr.difficulty} · ${pr.minutes} min · Python in an isolated worker`,
      mock ? '<div class="timer" id="round-time"></div>' : "",
    ) +
      `<div class="split"><div><article class="panel"><h2>The challenge</h2><p>${esc(pr.statement)}</p><h3>Constraints</h3><p>${esc(pr.constraints)}</p><h3>Examples</h3>${pr.examples.map((e) => `<pre>${esc(e)}</pre>`).join("")}${pr.shape ? `<h3>Shape table</h3><pre>${esc(pr.shape)}</pre><h3>Numerical stability</h3><p>${esc(pr.stability)}</p><h3>In production</h3><p>${esc(pr.production)}</p>` : ""}<details><summary>Visible tests (${pr.visible.length})</summary><pre>${esc(pr.visible.join("\n"))}</pre></details></article><article class="panel"><h3>Stuck? Take a smaller step.</h3><p>Hints cost 5, 10, then 15 XP. Your balance never goes below zero.</p>${mock ? "<p>Hints are disabled during the timed round.</p>" : '<button class="btn" id="hint">Reveal hint 1 · 5 XP</button>'}<div id="hints"></div><div class="actions" style="margin-top:15px"><button class="btn" id="giveup">Give up & study solution</button></div><div id="editorial"></div></article>${link("practice", "← Problem library")}</div><div><p class="mobile-note notice">Continue on desktop to edit and execute Python. On mobile, read the statement and your saved code.</p><div class="editor-box"><div class="editor-head"><span>solution.py</span><span>PYTHON · PYODIDE 0.29.5</span></div><div id="code-editor" aria-label="Python code editor"></div><textarea id="code-fallback" aria-label="Python code editor" spellcheck="false">${esc(code)}</textarea><div class="editor-tools"><button class="btn" id="run">▷ Run tests</button><button class="btn primary" id="submit">Submit →</button><button class="btn stop" id="terminate" hidden>■ Terminate</button><button class="btn" id="reset-code">Reset code</button><button class="btn" id="plain-editor">Plain editor</button></div><div id="console" class="console" role="status" aria-live="polite">Ready. The first run downloads Python. No code runs on a server.</div></div><div id="results"></div><p class="subtle" style="margin-top:14px">10s execution limit · 12 KB output cap · peak Python memory unavailable.<br>Hidden checks load on Submit. Static practice tests are inspectable; scores are not a secure assessment.</p><article class="panel"><h3>Submission history</h3><div id="history"></div></article>${mock ? '<button class="btn" id="debrief">Finish round & debrief →</button>' : ""}</div></div>`,
  );
  const update = (value: string) => {
    code = value;
    p.drafts[id] = value;
    void save();
  };
  on("#plain-editor", "click", () => {
    plain = true;
    editor?.dispose();
    editor = undefined;
    $("#code-editor").hidden = true;
    $<HTMLTextAreaElement>("#code-fallback").hidden = false;
    $<HTMLTextAreaElement>("#code-fallback").focus();
  });
  const fallback = $<HTMLTextAreaElement>("#code-fallback");
  fallback.readOnly = matchMedia("(max-width:700px)").matches;
  fallback.addEventListener("input", () => update(fallback.value));
  if (!matchMedia("(max-width:700px)").matches) {
    void import("./editor")
      .then((mod) => {
        if (routeToken !== token || plain) return;
        editor = mod.createEditor($("#code-editor"), code, (v) => {
          fallback.value = v;
          update(v);
        });
        fallback.hidden = true;
      })
      .catch(() => {
        if (routeToken !== token) return;
        toast("Monaco could not load. The plain code editor is available.");
        $("#code-editor").hidden = true;
      });
  }
  const history = () => {
    const list = p.submissions
      .filter((s) => s.problem === id)
      .slice(-10)
      .reverse();
    $("#history").innerHTML = list.length
      ? `<label class="subtle">Compare attempt <select id="attempt"><option value="">Choose an attempt</option>${list.map((s, i) => `<option value="${i}">${new Date(s.at).toLocaleString()} · ${s.passed ? "passed" : "failed"}</option>`).join("")}</select></label><div id="diff"></div>${list.map((s) => `<div class="test-row">${s.passed ? "✓ Passed" : "↻ Try again"} · ${Math.round(s.elapsed / 1000)}s total · ${new Date(s.at).toLocaleDateString()}</div>`).join("")}`
      : "<p>No submissions yet. Run the visible tests, then submit.</p>";
    on("#attempt", "change", () => {
      const val = $<HTMLSelectElement>("#attempt").value;
      if (val === "") {
        $("#diff").innerHTML = "";
        return;
      }
      const old = list[Number(val)].code;
      const current = editor?.value() ?? code;
      const a = old.split("\n"),
        b = current.split("\n");
      $("#diff").innerHTML =
        `<p class="subtle">Line comparison · previous attempt → current draft</p><pre>${Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] === b[i] ? `  ${esc(a[i] ?? "")}` : `− ${esc(a[i] ?? "")}\n+ ${esc(b[i] ?? "")}`)).join("\n")}</pre>`;
    });
  };
  history();
  const showEditorial = () => {
    $("#editorial").innerHTML =
      `<details open><summary>Editorial & reference solution</summary><p>${esc(pr.editorial)}</p><p>${esc(pr.complexity)}</p><pre>${esc(reference)}</pre><h3>Common mistakes</h3><ul class="rubric">${pr.mistakes.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></details>`;
  };
  const checks = async () => {
    const response = await fetch(`/ascent/checks/${id}.json`);
    if (!response.ok)
      throw new Error(
        "Could not load additional tests. Connect to the internet and retry.",
      );
    return response.json() as Promise<{ hidden: string[]; reference: string }>;
  };
  const execute = async (submit: boolean) => {
    if (busy) return;
    busy = true;
    $<HTMLButtonElement>("#run").disabled = true;
    $<HTMLButtonElement>("#submit").disabled = true;
    $("#terminate").hidden = false;
    $("#console").textContent =
      "Starting Python worker… the initial download may take up to 90 seconds.";
    const source = editor?.value() ?? code;
    try {
      let tests = pr.visible;
      if (submit) {
        const extra = await checks();
        tests = [...tests, ...extra.hidden];
        reference = extra.reference;
      }
      const result = await runner.run(source, tests);
      if (token !== routeToken) return;
      $("#console").textContent = result.error ?? result.output ?? "";
      $("#results").innerHTML = renderResult(result);
      if (submit) {
        p.submissions.push({
          problem: id,
          code: source,
          at: new Date().toISOString(),
          passed: result.passed,
          elapsed: Date.now() - opened,
          hinted,
          timed: Boolean(mock),
        });
        p.skills[String(pr.track)] = mastery(
          p.skills[String(pr.track)],
          result.passed,
        );
        p.cards["problem:" + id] = schedule(
          p.cards["problem:" + id],
          result.passed && !hinted ? 4 : 2,
        );
        if (result.passed) {
          if (!p.completed.includes("problem:" + id)) {
            reward(p, hinted ? 15 : 35);
            p.completed.push("problem:" + id);
          }
          showEditorial();
        }
        if (mock)
          mock.attempts.push({
            problem: id,
            passed: result.passed,
            elapsed: Date.now() - opened,
          });
        await save();
        history();
      }
    } catch (e) {
      if (token === routeToken) $("#console").textContent = String(e);
    } finally {
      busy = false;
      if (token === routeToken) {
        $<HTMLButtonElement>("#run").disabled = false;
        $<HTMLButtonElement>("#submit").disabled = false;
        $("#terminate").hidden = true;
      }
    }
  };
  on("#run", "click", () => void execute(false));
  on("#submit", "click", () => void execute(true));
  on("#terminate", "click", () => runner.terminate());
  on("#reset-code", "click", () => {
    p.drafts[id] = pr.starter;
    void save();
    void problemPage(id);
  });
  on("#hint", "click", () => {
    if (hint >= 3) return;
    hinted = true;
    p.xp = Math.max(0, p.xp - 5 * (hint + 1));
    $("#hints").insertAdjacentHTML(
      "beforeend",
      `<p class="notice">${esc(pr.hints[hint])}</p>`,
    );
    hint++;
    const button = $<HTMLButtonElement>("#hint");
    button.textContent =
      hint === 3
        ? "All hints revealed"
        : `Reveal hint ${hint + 1} · ${5 * (hint + 1)} XP`;
    button.disabled = hint === 3;
    void save();
  });
  on("#giveup", "click", async () => {
    if (mock) {
      toast("Finish the timed round before revealing a solution.");
      return;
    }
    hinted = true;
    try {
      reference = (await checks()).reference;
      showEditorial();
      p.cards["problem:" + id] = schedule(p.cards["problem:" + id], 1);
      await save();
    } catch (e) {
      toast(String(e));
    }
  });
  on("#debrief", "click", debrief);
  if (mock) {
    $("#view").insertAdjacentHTML(
      "afterbegin",
      `<div class="panel actions"><label class="subtle" for="round-phase">Current phase</label><select id="round-phase">${["read", "plan", "code", "test"].map((phase) => `<option ${mock?.phase === phase ? "selected" : ""}>${phase}</option>`).join("")}</select>${mock.mode === "coding" ? link("problem/" + (id === "first-repeat" ? "counts" : "first-repeat"), "Switch to problem " + (id === "first-repeat" ? "2" : "1") + " →") : ""}<button class="btn" id="round-end">End round</button></div>`,
    );
    on("#round-phase", "change", () => {
      if (!mock) return;
      mock.phases[mock.phase] += Date.now() - mock.phaseStarted;
      mock.phase = $<HTMLSelectElement>("#round-phase").value;
      mock.phaseStarted = Date.now();
    });
    on("#round-end", "click", debrief);
    timer = setInterval(() => {
      if (!mock) return;
      const left = Math.max(0, Math.ceil((mock.end - Date.now()) / 1000));
      const el = $("#round-time");
      if (el)
        el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (!left) {
        runner.terminate();
        debrief();
      }
    }, 1000);
  }
}
function renderResult(result: RunResult) {
  return `<article class="panel" style="margin-top:15px"><h3>${result.passed ? "All tests passed" : "Keep iterating"}</h3><p>${result.tests.filter((t) => t.passed).length}/${result.tests.length} checks · ${(result.elapsed / 1000).toFixed(2)}s wall time (includes startup)</p>${result.tests.map((t) => `<div class="test-row">${t.passed ? "✓" : "×"} ${esc(t.name)}${t.error ? `<pre>${esc(t.error)}</pre>` : ""}</div>`).join("")}</article>`;
}
function readinessPage() {
  const weak = [...tracks]
    .sort(
      (a, b) =>
        effectiveLevel(p.skills[String(a.id)]) -
        effectiveLevel(p.skills[String(b.id)]),
    )
    .slice(0, 3);
  shell(
    "readiness",
    heading(
      "EVIDENCE, NOT PREDICTIONS",
      "See the gaps. Choose the work.",
      "These scores are coarse study guides. They do not predict an interview outcome.",
    ) +
      `<div class="dashboard"><div>${labs
        .slice(1)
        .map((l) => {
          const score = readiness(p, l.weights);
          return `<article class="panel"><div class="panel-top"><h2>${l.name}</h2><span class="pill">${score}% · HEURISTIC</span></div><div class="progress-bar"><span style="width:${score}%"></span></div><p>${esc(l.note)}</p><details><summary>How this score is calculated</summary><p>60% weighted mastery (0–5), 20% distinct solved coverage out of 15 problems, 20% success rate on recent unhinted timed-round submissions completed in ≤60 minutes. With no timed evidence, that component is zero.</p><pre>Track weights 0–12: ${l.weights.join(", ")}</pre></details></article>`;
        })
        .join(
          "",
        )}</div><aside><article class="panel"><h2>Your skill landscape</h2>${radar()}</article><article class="panel"><h2>Three next steps</h2>${weak.map((t) => `<p><strong>${t.title}</strong><br>Mastery ${effectiveLevel(p.skills[String(t.id)])}/5 · ${lessons.some((l) => l.track === t.id) ? link("learn", "Find a lesson →") : "Outline available; curriculum coming soon"}</p>`).join("")}</article><article class="panel"><h3>Mistake patterns</h3>${
        Object.entries(p.mistakes)
          .map(([k, v]) => `<p>${esc(k)}: ${v}</p>`)
          .join("") || "<p>Attempt a lesson to build a useful pattern.</p>"
      }</article></aside></div><article class="panel table-wrap"><h2>All 13 tracks</h2><table><thead><tr><th>Track</th><th>Mastery</th><th>Evidence dates</th></tr></thead><tbody>${tracks.map((t) => `<tr><td>${t.id}. ${t.title}</td><td>${effectiveLevel(p.skills[String(t.id)])}/5</td><td>${p.skills[String(t.id)]?.dates.length ?? 0} separate days</td></tr>`).join("")}</tbody></table></article>`,
  );
}
const themes = [
  "Motivation for a lab",
  "Safety or ethics concern",
  "Disagreement",
  "Feedback that changed my work",
  "Failure",
  "End-to-end ownership",
  "Ambiguity",
  "Being wrong about a technical claim",
];
function interview() {
  shell(
    "interview",
    heading(
      "PRACTICE UNDER CONSTRAINTS",
      "The interview studio.",
      "Original mock exercises. Preparation formats are editable hypotheses, not official lab loops.",
    ) +
      `<div class="dashboard"><div><article class="panel feature"><div class="eyebrow">01 / TIMED CODING</div><h2>Think clearly. Build deliberately.</h2><p>Two original problems in 45 minutes. No hints. Track your read, plan, code and test phases.</p><button class="btn primary" id="start-round">Start a coding round →</button></article><article class="panel"><div class="eyebrow">02 / ML CODING · NO AI</div><h2>From scratch, with tests.</h2><p>35 minutes to implement a causal attention head. Shape tracking and numerical stability included.</p><button class="btn" id="ml-round">Start an ML round →</button></article><article class="panel"><div class="eyebrow">03 / EVOLVING REQUIREMENTS</div><h2>A counter that grows up.</h2><p>Implement a counter, then add undo, then transactions. Each stage unlocks only after its tests pass.</p>${link("evolving", "Start the three-part exercise →")}</article><article class="panel"><div class="eyebrow">SYSTEM DESIGN · SELF-ASSESSMENT</div><h2>Design a reliable inference queue.</h2><p>Discuss bursty arrivals, bounded capacity, cancellation, retries, fairness and backpressure. Make a resource estimate and describe failure recovery.</p><textarea id="design" rows="5" aria-label="System design notes">${esc(p.stories.design ?? "")}</textarea><button class="btn" id="design-rubric">Save & reveal rubric</button><div id="design-feedback"></div></article></div><aside><article class="panel"><h2>Your story bank</h2><p>Real events only. Describe the situation, your specific action, the measurable result, and what you would change.</p><label class="subtle" for="story-theme">Theme</label><select id="story-theme">${themes.map((t) => `<option>${t}</option>`).join("")}</select><textarea id="story" rows="8" aria-label="Your behavioral story">${esc(p.stories[themes[0]] ?? "")}</textarea><div class="actions"><button class="btn primary" id="save-story">Save story</button><button class="btn" id="random-story">Random prompt</button></div><p id="coverage" class="subtle">${themes.filter((t) => p.stories[t]?.trim()).length} / ${themes.length} themes covered</p></article><article class="panel"><h3>Still to come</h3><p>Half-day mock loops, recording, sharded data loaders, richer ML debugging traces, and AI-assisted round defense are not built yet.</p></article></aside></div>`,
  );
  on("#start-round", "click", () => startMock("coding", 45, "first-repeat"));
  on("#ml-round", "click", () => startMock("ML coding", 35, "attention-head"));
  on("#story-theme", "change", () => {
    $<HTMLTextAreaElement>("#story").value =
      p.stories[$<HTMLSelectElement>("#story-theme").value] ?? "";
  });
  on("#save-story", "click", () => {
    p.stories[$<HTMLSelectElement>("#story-theme").value] =
      $<HTMLTextAreaElement>("#story").value;
    void save();
    $("#coverage").textContent =
      `${themes.filter((t) => p.stories[t]?.trim()).length} / ${themes.length} themes covered`;
    toast("Story saved in this browser.");
  });
  on("#random-story", "click", () => {
    const t = themes[Math.floor(Math.random() * themes.length)];
    $<HTMLSelectElement>("#story-theme").value = t;
    $<HTMLTextAreaElement>("#story").value = p.stories[t] ?? "";
    toast(
      `Tell me about: ${t.toLowerCase()}. What did you do, and what changed?`,
    );
  });
  on("#design-rubric", "click", () => {
    const value = $<HTMLTextAreaElement>("#design").value;
    if (value.trim().length < 30) {
      toast("Write your approach before revealing the rubric.");
      return;
    }
    p.stories.design = value;
    void save();
    $("#design-feedback").innerHTML =
      '<ul class="rubric"><li>Clarify latency, throughput, availability and capacity requirements.</li><li>Estimate queue growth and memory under a burst.</li><li>Bound admission, use backpressure, and define overload behavior.</li><li>Handle retries idempotently and cancel abandoned work.</li><li>Measure tail latency, fairness, errors and saturation.</li><li>Explain recovery and the cost of each tradeoff.</li></ul><p class="subtle">Self-grade each criterion 0–2; defend the evidence for your score.</p>';
  });
}
function startMock(mode: string, minutes: number, id: string) {
  mock = {
    mode,
    started: Date.now(),
    end: Date.now() + minutes * 60000,
    phaseStarted: Date.now(),
    phase: "read",
    phases: { read: 0, plan: 0, code: 0, test: 0 },
    attempts: [],
  };
  location.hash = "problem/" + id;
}
function debrief() {
  if (!mock) return;
  const m = mock;
  m.phases[m.phase] += Date.now() - m.phaseStarted;
  mock = undefined;
  shell(
    "interview",
    heading(
      "ROUND DEBRIEF",
      "Make the next round better.",
      `${m.mode} · ${Math.round((Date.now() - m.started) / 60000)} minutes · ${m.attempts.filter((a) => a.passed).length} passing submissions`,
    ) +
      `<article class="panel"><h2>The evidence</h2><p>${Object.entries(m.phases)
        .map(([phase, ms]) => `${phase}: ${Math.round(ms / 1000)}s`)
        .join(
          " · ",
        )}</p>${m.attempts.map((a) => `<p>${esc(a.problem)} · ${a.passed ? "passed" : "failed"} · ${Math.round(a.elapsed / 1000)}s</p>`).join("") || "<p>No submissions recorded. A useful next goal is getting a tested draft in before time expires.</p>"}<h3>Three things to revisit</h3><ol class="rubric"><li>State the invariant before coding. ${link("lesson/hashing", "Revisit arrays & hashing →")}</li><li>Write the smallest boundary-case test. ${link("lesson/debug-cost", "Revisit debugging →")}</li><li>Explain time, memory and a rejected alternative. ${link("interview", "Revisit your story bank →")}</li></ol>${link("interview", "Back to the studio →", true)}</article>`,
  );
}
function evolving() {
  let stage = 0;
  let code =
    "class Counter:\n    def __init__(self):\n        self.value = 0\n    def add(self, n):\n        pass\n";
  shell(
    "interview",
    heading(
      "EVOLVING REQUIREMENTS",
      "One interface. New constraints.",
      "Three stages. Passing each one reveals the next requirement.",
    ) +
      `<article class="panel"><h2 id="stage-title"></h2><p id="stage-prompt"></p><textarea id="stage-code" rows="15" aria-label="Counter implementation">${esc(code)}</textarea><div class="actions"><button class="btn primary" id="stage-run">Run cumulative tests →</button><button class="btn" id="stage-stop">Terminate</button></div><div class="console" id="stage-result" role="status"></div></article>`,
  );
  const stages = [
    {
      title: "1 / A simple counter",
      prompt:
        "Implement Counter() with .value initially 0 and add(n) that adds an integer to it.",
      tests: [
        "c=Counter(); assert c.value==0; c.add(3); assert c.value==3; c.add(-1); assert c.value==2",
      ],
    },
    {
      title: "2 / Undo the last change",
      prompt:
        "Keep stage 1 working. Add undo() to reverse the most recent add. Calling undo with no history does nothing.",
      tests: [
        "c=Counter(); c.undo(); assert c.value==0; c.add(2); c.add(3); c.undo(); assert c.value==2; c.undo(); assert c.value==0",
      ],
    },
    {
      title: "3 / Roll back a transaction",
      prompt:
        "Keep stages 1–2 working. begin() saves value and undo history; rollback() restores both. Only one transaction is active. rollback with none does nothing.",
      tests: [
        "c=Counter(); c.add(4); c.begin(); c.add(10); c.rollback(); assert c.value==4; c.undo(); assert c.value==0; c.rollback(); assert c.value==0",
      ],
    },
  ];
  const show = () => {
    $("#stage-title").textContent = stages[stage].title;
    $("#stage-prompt").textContent = stages[stage].prompt;
  };
  show();
  on("#stage-run", "click", async () => {
    const button = $<HTMLButtonElement>("#stage-run");
    button.disabled = true;
    code = $<HTMLTextAreaElement>("#stage-code").value;
    $("#stage-result").textContent = "Starting Python…";
    const result = await runner.run(
      code,
      stages.slice(0, stage + 1).flatMap((s) => s.tests),
    );
    if (!root.querySelector("#stage-result")) return;
    $("#stage-result").textContent =
      result.error ??
      result.tests
        .map((t) => `${t.passed ? "✓" : "×"} ${t.name} ${t.error ?? ""}`)
        .join("\n");
    button.disabled = false;
    if (result.passed) {
      if (stage < 2) {
        stage++;
        show();
        toast("Stage passed. A new requirement is now visible.");
      } else {
        if (!p.completed.includes("evolving")) {
          p.completed.push("evolving");
          reward(p, 50);
          void save();
        }
        button.disabled = true;
        button.textContent = "✓ All three stages passed";
      }
    }
  });
  on("#stage-stop", "click", () => runner.terminate());
}
function fieldRadar() {
  shell(
    "radar",
    heading(
      "CHECK THE SOURCE",
      "The field keeps moving.",
      "A dated verification ledger. No automatic news feed or implied live updates.",
    ) +
      `<article class="panel"><div class="eyebrow">VERIFICATION SNAPSHOT / OCT 24, 2026</div><h2>What this release checked</h2><p>Python runtime pinned to Pyodide 0.29.5 after reviewing the official releases. The worker approach follows the official usage guide. This is a snapshot, not a claim that it is the newest version today.</p><p><a class="source" href="https://github.com/pyodide/pyodide/releases/tag/0.29.5" target="_blank" rel="noopener noreferrer">Pyodide release ↗</a> · <a class="source" href="https://pyodide.org/en/stable/usage/webworker.html" target="_blank" rel="noopener noreferrer">Worker guide ↗</a></p><p>Curriculum emphasizes shape tracking, stable softmax, gradient accumulation and original practice problems. Core mathematical material links to primary documentation in each lesson.</p></article>${labs
        .slice(1)
        .map(
          (l) =>
            `<article class="panel"><div class="panel-top"><h2>${l.name}</h2><span class="pill">${l.last_verified ?? "NOT VERIFIED"}</span></div><p>${esc(l.note)}</p><a class="source" href="${l.source}" target="_blank" rel="noopener noreferrer">Primary source ↗</a></article>`,
        )
        .join(
          "",
        )}<p class="subtle">To update this ledger, edit content/labs/profiles.yaml and the source/date together. A recruitment guide does not guarantee a role-specific loop.</p>`,
  );
}
function settings() {
  shell(
    "settings",
    heading(
      "YOUR DATA, YOUR PACE",
      "Keep your progress with you.",
      "No login. No analytics. Your learning record lives in this browser.",
    ) +
      `<article class="panel"><h2>Your daily intention</h2><p>Choose a soft XP goal. Going beyond it is optional.</p><label for="goal">XP per day </label><input id="goal" type="number" min="10" max="1000" value="${p.goal}"/><label for="rest"> Weekly rest day </label><select id="rest">${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => `<option value="${i}" ${p.restDay === i ? "selected" : ""}>${d}</option>`).join("")}</select><button class="btn" id="save-goal">Save intention</button><p>Hearts are off. One missed-day streak freeze is available per calendar week. Rest days are a planning preference and do not earn XP.</p></article><article class="panel"><h2>Back up your learning</h2><p>Export before switching browsers or clearing site data. Import replaces this browser’s current progress after validation.</p><div class="actions"><button class="btn primary" id="export">Export progress JSON ↓</button><label class="btn" for="import">Import progress JSON ↑</label><input id="import" type="file" accept="application/json,.json" class="sr-only"/></div></article><article class="panel"><h2>Badges & activity</h2><p>${p.completed.length ? "✓ First retrieval session" : "○ Complete your first session"}<br>${p.submissions.some((s) => s.passed && !s.hinted) ? "✓ Solved without hints" : "○ Solve a problem without hints"}<br>${p.completed.includes("problem:attention-head") ? "✓ Attention from scratch" : "○ Implement attention from scratch"}<br>${p.bosses.length ? `✓ ${p.bosses.length} checkpoints passed` : "○ Clear a boss checkpoint"}</p><p>${
        Object.entries(p.days)
          .slice(-14)
          .map(([d, xp]) => `${esc(d)} · ${xp} XP`)
          .join("<br>") || "Activity will appear after your first exercise."
      }</p></article>`,
  );
  on("#save-goal", "click", () => {
    const n = Number($<HTMLInputElement>("#goal").value);
    if (!Number.isInteger(n) || n < 10 || n > 1000) {
      toast("Choose an integer goal between 10 and 1000.");
      return;
    }
    p.goal = n;
    p.restDay = Number($<HTMLSelectElement>("#rest").value);
    void save();
    toast("Intention saved.");
  });
  on("#export", "click", () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascent-progress-${day()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  on("#import", "change", async () => {
    const file = $<HTMLInputElement>("#import").files?.[0];
    if (!file) return;
    if (file.size > 5000000) {
      toast("Progress file is too large (limit 5 MB).");
      return;
    }
    try {
      const imported = parseProgress(JSON.parse(await file.text()));
      p = imported;
      await save();
      settings();
      toast("Progress imported.");
    } catch (e) {
      toast("Import rejected: " + String(e));
    }
  });
}
function missing() {
  shell(
    "home",
    heading(
      "PAGE NOT FOUND",
      "That step isn’t here.",
      "Choose a lesson or problem from the library.",
    ) + link("home", "Back to overview →"),
  );
}
function locked(track: number) {
  shell(
    "learn",
    heading(
      "PREREQUISITES",
      "Build the foundation first.",
      `Track ${track} needs mastery level 1 and a passed checkpoint in each prerequisite track.`,
    ) + link("learn", "View prerequisites →"),
  );
}
function route() {
  routeToken++;
  const [page = "home", id] = location.hash.slice(1).split("/");
  if (page === "main") {
    document.getElementById("main")?.focus();
    return;
  }
  switch (page) {
    case "":
    case "home":
      home();
      break;
    case "learn":
      learn();
      break;
    case "lesson":
      startLesson(id);
      break;
    case "boss": {
      const lesson = lessons.find((l) => l.track === Number(id));
      if (lesson) startLesson(lesson.id, true);
      else missing();
      break;
    }
    case "placement":
      placement();
      break;
    case "review":
      review();
      break;
    case "practice":
      practice();
      break;
    case "problem":
      void problemPage(id);
      break;
    case "readiness":
      readinessPage();
      break;
    case "interview":
      interview();
      break;
    case "evolving":
      evolving();
      break;
    case "radar":
      fieldRadar();
      break;
    case "settings":
      settings();
      break;
    default:
      missing();
  }
  window.scrollTo(0, 0);
}
export async function mount() {
  root = document.getElementById("ascent-app")!;
  try {
    p = await store.load();
  } catch {
    storage = false;
  }
  route();
  window.addEventListener("hashchange", route);
  if ("serviceWorker" in navigator)
    navigator.serviceWorker
      .register("/ascent/sw.js", { scope: "/ascent/" })
      .catch(() => {});
}
