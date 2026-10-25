import { evidence, knowledge, recommend, studyPaths } from "./curriculum";
import type { Progress } from "./engine";
import { day, mastery, reward, schedule } from "./engine";
import katex from "katex";
export { knowledge } from "./curriculum";
export const domains = [...new Set(knowledge.map((k) => k.domain))];
const esc = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const a = (to: string, title: string, primary = false) =>
  `<a class="btn ${primary ? "primary" : ""}" href="#${to}">${title}</a>`;
type Context = {
  root: HTMLElement;
  progress: () => Progress;
  save: () => Promise<boolean>;
  shell: (page: string, html: string) => void;
  heading: (
    label: string,
    title: string,
    description: string,
    extra?: string,
  ) => string;
  toast: (message: string) => void;
};
export function advancedUI(c: Context) {
  const p = () => c.progress();
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    c.root.querySelector<T>(selector)!;
  const on = (selector: string, event: string, fn: (e: Event) => void) =>
    c.root
      .querySelectorAll(selector)
      .forEach((el) => el.addEventListener(event, fn));
  const articleCard = (k: (typeof knowledge)[number], question = false) =>
    `<a class="knowledge-card" href="#${question ? "question/" + k.question.id : "concept/" + k.id}"><div class="eyebrow">${k.domain.toUpperCase()} <span class="subtle">/ ${k.level.toUpperCase()}</span></div><h2>${esc(question ? k.question.prompt : k.title)}</h2><p>${esc(k.summary)}</p><div class="card-bottom"><span>${p().completed.includes("knowledge:" + k.id) ? "✓ Retrieved" : p().completed.includes("bookmark:" + k.id) ? "◇ Saved" : "6–12 min study"}</span><span aria-hidden="true">↗</span></div></a>`;
  const reviewList = () =>
    knowledge.filter((k) =>
      ["knowledge:" + k.id, "question:" + k.question.id].some(
        (id) => (p().cards[id]?.due ?? "9999-12-31") <= day(),
      ),
    );
  function home() {
    const reviewed = knowledge.filter((k) =>
      p().completed.includes("knowledge:" + k.id),
    ).length;
    const interviewCount = knowledge.filter((k) =>
      p().completed.includes("question:" + k.question.id),
    ).length;
    const recommendation = recommend(p(), 1)[0];
    const next = recommendation?.concept ?? knowledge[0];
    c.shell(
      "home",
      c.heading(
        "RESEARCH ENGINEERING / YOUR KNOWLEDGE WORKSPACE",
        "Your next step starts here.",
        "Connect the mechanism, the implementation, and the evidence. Built for an intermediate Python and ML baseline.",
        a("knowledge", "Explore the knowledge base →", true),
      ) +
        `<div class="stats"><div class="metric"><strong>${knowledge.length}</strong><span>Connected technical references</span></div><div class="metric"><strong>${knowledge.length}</strong><span>Original interview questions</span></div><div class="metric"><strong>${reviewed} / ${knowledge.length}</strong><span>Concepts retrieved from memory</span></div><div class="metric"><strong>${reviewList().length}</strong><span>Concepts & questions due for review</span></div></div><div class="dashboard"><div><article class="panel feature"><div class="eyebrow">START WITH DEPTH</div><h2>Know why it works.<br>Then defend the tradeoff.</h2><p>Study attention, training objectives, inference systems, evaluation and tool reliability. Every note connects to a worked example, interview question and implementation exercise.</p><div class="actions">${a(recommendation?.to ?? "knowledge-review", recommendation ? "Continue: " + esc(next.title) + " →" : "Review after a gap →", true)}</div></article><article class="panel"><div class="panel-top"><h2>A focused study session</h2><span class="subtle">~35 MIN</span></div>${[
          [
            recommendation?.to ?? `concept/${next.id}`,
            "01",
            "Understand the mechanism",
            "A sourced reference and worked example",
          ],
          [
            `question/${next.question.id}`,
            "02",
            "Explain it without notes",
            "Interview prompt, follow-ups and rubric",
          ],
          [
            `problem/${next.problem}`,
            "03",
            "Test the implementation",
            "Write code; test shapes, numerics and edge cases",
          ],
        ]
          .map(
            ([to, n, title, meta]) =>
              `<div class="plan-item"><span class="step">${n}</span><div class="copy"><h3>${title}</h3><p>${meta}</p></div><a href="#${to}" aria-label="${esc(title)}">↗</a></div>`,
          )
          .join("")}</article><div class="knowledge-grid">${knowledge
          .slice(0, 2)
          .map((k) => articleCard(k))
          .join(
            "",
          )}</div></div><aside><article class="panel"><div class="eyebrow">YOUR STARTING POINT</div><h2>Build on what you know.</h2><p>Python syntax and basic ML are assumed. Use foundations only when a specific gap gets in your way.</p>${a("paths", "Choose a study path →")}<div class="progress-bar"><span style="width:${(reviewed / knowledge.length) * 100}%"></span></div><p>${reviewed} concepts retrieved · ${interviewCount} questions assessed</p></article><article class="panel"><h2>Retrieval, not just reading.</h2><p>Write an explanation before revealing the answer. Self-assess against a rubric, then revisit it after a gap.</p>${a("knowledge-review", "Open advanced review →")}</article><article class="panel"><h2>Six connected domains</h2><div class="topic-links">${domains.map((d) => a("knowledge?domain=" + encodeURIComponent(d), d)).join("")}</div></article><article class="panel"><h3>Optional refreshers</h3><p>The earlier lessons and coding workspace remain available. Advanced references are open without beginner checkpoints.</p>${a("learn", "Foundation refreshers →")}</article></aside></div>`,
    );
  }
  function library(question = false, params = "") {
    c.shell(
      question ? "questions" : "knowledge",
      c.heading(
        question ? "RETRIEVE / EXPLAIN / DEFEND" : "THE AI KNOWLEDGE BASE",
        question ? "Prepare for the follow-up." : "Depth you can navigate.",
        question
          ? "Original research-engineering prompts, model answers and explicit self-assessment rubrics. These are not company-confidential questions."
          : "Search mechanisms, equations, production failure modes and research connections. No beginner placement required.",
      ) +
        `<div class="filters"><label>Search<input id="knowledge-search" type="search" aria-label="Search ${question ? "interview questions" : "knowledge"}" placeholder="Try KV cache, gradient, retrieval…"/></label><label>Domain<select id="knowledge-domain" aria-label="Knowledge domain"><option value="">All domains</option>${domains.map((d) => `<option>${d}</option>`).join("")}</select></label><label>Status<select id="knowledge-status" aria-label="Knowledge status"><option value="">All references</option><option value="saved">Saved</option><option value="reviewed">Retrieved</option><option value="new">Not retrieved</option></select></label></div><p class="subtle" id="knowledge-count" role="status"></p><div class="knowledge-grid" id="knowledge-list"></div>`,
    );
    const domain = new URLSearchParams(params).get("domain");
    if (domain) $<HTMLSelectElement>("#knowledge-domain").value = domain;
    const filter = () => {
      const q = $<HTMLInputElement>("#knowledge-search")
        .value.toLowerCase()
        .trim();
      const domain = $<HTMLSelectElement>("#knowledge-domain").value;
      const status = $<HTMLSelectElement>("#knowledge-status").value;
      const matches = knowledge.filter(
        (k) =>
          (!q ||
            [
              k.title,
              k.summary,
              k.explanation,
              k.domain,
              k.question.prompt,
              k.pitfalls.join(" "),
            ]
              .join(" ")
              .toLowerCase()
              .includes(q)) &&
          (!domain || domain === k.domain) &&
          (!status ||
            (status === "saved"
              ? p().completed.includes("bookmark:" + k.id)
              : status === "reviewed"
                ? p().completed.includes("knowledge:" + k.id)
                : !p().completed.includes("knowledge:" + k.id))),
      );
      $("#knowledge-count").textContent =
        `${matches.length} ${question ? "questions" : "references"}`;
      $("#knowledge-list").innerHTML = matches.length
        ? matches.map((k) => articleCard(k, question)).join("")
        : '<div class="panel"><h2>No matches yet.</h2><p>Try another phrase or clear a filter.</p></div>';
    };
    on("#knowledge-search", "input", filter);
    on("select", "change", filter);
    filter();
  }
  function detail(id: string, isQuestion = false) {
    const k = knowledge.find((k) =>
      isQuestion ? k.question.id === id : k.id === id,
    );
    if (!k) {
      c.shell(
        "knowledge",
        c.heading(
          "NOT FOUND",
          "That reference isn’t here.",
          "Choose a reference from the knowledge library.",
        ) + a("knowledge", "Back to library"),
      );
      return;
    }
    const key = isQuestion ? "question:" + k.question.id : "knowledge:" + k.id;
    const draft = "advanced-note:" + key;
    const done = p().completed.includes(key);
    const proof = evidence(p(), k);
    c.shell(
      isQuestion ? "questions" : "knowledge",
      c.heading(
        `${k.domain.toUpperCase()} / ${isQuestion ? "INTERVIEW QUESTION" : k.level.toUpperCase()}`,
        esc(isQuestion ? k.question.prompt : k.title),
        isQuestion
          ? "Attempt first. Then compare reasoning, tests and tradeoffs."
          : esc(k.summary),
        `<button class="btn" id="bookmark">${p().completed.includes("bookmark:" + k.id) ? "◇ Saved" : "Save reference ◇"}</button>`,
      ) +
        `<div class="dashboard"><div>${!isQuestion ? `<article class="panel prose-note"><h2>The mechanism</h2><p>${esc(k.explanation)}</p><div class="equation">${katex.renderToString(k.equation, { throwOnError: false, displayMode: true })}</div><h2>A worked example</h2><p>${esc(k.example)}</p><h2>Failure modes to recognize</h2><ul class="rubric">${k.pitfalls.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>` : ""}<article class="panel"><div class="eyebrow">${isQuestion ? "YOUR ANSWER" : "CLOSE THE LOOP / RETRIEVAL"}</div><h2>${isQuestion ? "Reason it through." : "Explain it without the note."}</h2><p>${isQuestion ? "Give a mechanism, concrete example, edge case, test and tradeoff." : "Describe the core mechanism, then name one failure mode and how you would test it."}</p><textarea id="knowledge-note" rows="7" aria-label="Your technical explanation" placeholder="Write your reasoning here…">${esc(p().stories[draft] ?? "")}</textarea><div class="actions"><button class="btn" id="save-note">Save draft</button><button class="btn primary" id="reveal-answer">Reveal ${isQuestion ? "answer and rubric" : "recall checklist"} →</button></div><div id="knowledge-answer" aria-live="polite"></div></article><div class="actions">${a(isQuestion ? "concept/" + k.id : "question/" + k.question.id, isQuestion ? "Read the connected concept →" : "Practice the interview question →")}${a("problem/" + k.problem, k.exercise_role === "application" ? "Open application exercise →" : "Open prerequisite drill →")}</div></div><aside><article class="panel"><h2>Before this concept</h2><div class="topic-links">${
          k.prerequisites
            .map((id) => {
              const item = knowledge.find((item) => item.id === id)!;
              return a("concept/" + id, esc(item.title));
            })
            .join("") ||
          "<p>No advanced prerequisites. Use foundation refreshers for a specific gap.</p>"
        }</div><h2>Connections</h2><p>Compare a neighboring mechanism.</p><div class="topic-links">${k.related
          .map((id) => knowledge.find((item) => item.id === id))
          .filter((item) => !!item)
          .map((item) => a("concept/" + item.id, esc(item.title) + " ↗"))
          .join(
            "",
          )}</div></article><article class="panel"><h2>Primary reading</h2>${k.sources.map((source) => `<p><a class="source" href="${source.url}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></p>`).join("")}<p class="subtle">Source checked ${k.last_verified}. Notes and interview questions are original educational synthesis. No claim of an official lab question.</p></article><article class="panel"><h2>Your evidence</h2><p>${done ? "✓ Previously retrieved or assessed" : "No retrieval assessment yet."}</p><ul class="rubric"><li>Mechanism recall: ${proof.recall ? "self-assessed" : "not recorded"}</li><li>Interview explanation: ${proof.explanation ? "self-assessed" : "not recorded"}</li><li>Application code: ${k.exercise_role === "prerequisite" ? "linked drill is a prerequisite" : proof.code ? "local checks passed without hints" : "no independent passing submission"}</li><li>Recall on separate days: ${proof.spaced ? "recorded" : "not recorded"}</li></ul><p class="subtle">Code checks cover this exercise’s contract, not the whole system or a GPU deployment.</p><p>Reading does not automatically mark a concept mastered. Your ratings are self-assessments, not externally graded results.</p>${p().cards[key] ? `<p>Next review: ${esc(p().cards[key].due)}</p>` : ""}</article></aside></div>`,
    );
    const saveDraft = () => {
      p().stories[draft] = $<HTMLTextAreaElement>("#knowledge-note").value;
      return c.save();
    };
    on("#save-note", "click", async () => {
      if (await saveDraft()) c.toast("Technical notes saved.");
    });
    on("#bookmark", "click", async () => {
      const key = "bookmark:" + k.id;
      p().completed = p().completed.includes(key)
        ? p().completed.filter((v) => v !== key)
        : [...p().completed, key];
      if (await c.save()) {
        $("#bookmark").textContent = p().completed.includes(key)
          ? "◇ Saved"
          : "Save reference ◇";
      }
    });
    on("#reveal-answer", "click", async () => {
      const text = $<HTMLTextAreaElement>("#knowledge-note").value.trim();
      if (text.length < 40) {
        c.toast("Write a substantive attempt before revealing the checklist.");
        return;
      }
      await saveDraft();
      $("#knowledge-answer").innerHTML =
        `<div class="feedback"><h3>${isQuestion ? "One strong answer" : "Recall checklist"}</h3><p>${esc(isQuestion ? k.question.answer : k.explanation)}</p><ul class="rubric">${k.question.rubric.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${isQuestion ? `<h3>Interviewer follow-ups</h3><ul class="rubric">${k.question.followups.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}<label for="self-rating">Your evidence-based self-assessment</label><select id="self-rating"><option value="">Choose a rating</option><option value="1">Needs another attempt</option><option value="3">Partly correct; missed a key point</option><option value="4">Solid explanation with tests and tradeoffs</option><option value="5">Could defend it under follow-up questions</option></select><button class="btn primary" id="record-retrieval">Record & schedule review</button><p class="subtle">Self-assessment is advisory. Compare specific statements in your answer to the rubric.</p></div>`;
      on("#record-retrieval", "click", async () => {
        const rating = Number($<HTMLSelectElement>("#self-rating").value);
        if (!rating) {
          c.toast("Choose a self-assessment rating first.");
          return;
        }
        p().cards[key] = schedule(p().cards[key], rating);
        if (!isQuestion && rating >= 4) {
          const dates = (p().conceptRecallDates ??= {});
          dates[k.id] = [...new Set([...(dates[k.id] ?? []), day()])];
        }
        p().skills[String(k.track)] = mastery(
          p().skills[String(k.track)],
          rating >= 4,
        );
        if (!p().completed.includes(key) && rating >= 4) {
          p().completed.push(key);
          reward(p(), 15);
        }
        if (await c.save()) {
          $<HTMLButtonElement>("#record-retrieval").disabled = true;
          c.toast("Review scheduled for " + p().cards[key].due);
        }
      });
    });
  }
  function pathsPage() {
    const paths = studyPaths;
    c.shell(
      "paths",
      c.heading(
        "RESEARCH ENGINEERING / STUDY PATHS",
        "Choose a thread. Follow it deeply.",
        "Each path links technical notes, original interview questions and runnable code. No beginner gatekeeping.",
      ) +
        paths
          .map(
            (path) =>
              `<article class="panel"><h2>${path.title}</h2><p>${path.goal}</p><button class="btn" data-study-path="${path.id}" ${p().studyPath === path.id ? "disabled" : ""}>${p().studyPath === path.id ? "Your active study path" : "Use this study path"}</button><div class="lesson-list">${path.ids
                .map((id, i) => {
                  const k = knowledge.find((k) => k.id === id)!;
                  return `<a class="lesson-link" href="#concept/${id}"><span>${String(i + 1).padStart(2, "0")} · ${k.title}</span><span>${evidence(p(), k).recall ? "✓ Recall recorded" : "Study →"}</span></a>`;
                })
                .join(
                  "",
                )}</div><h3>Project checkpoint · ${esc(path.capstone.project)}</h3><p><strong>${esc(path.capstone.title)}</strong></p><p>${esc(path.capstone.environment)}</p><ol class="rubric">${path.capstone.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol><h3>Evidence to collect</h3><ul class="rubric">${path.capstone.acceptance.map((item) => `<li>${esc(item)}</li>`).join("")}</ul><p class="subtle">External project checkpoint. Browser practice does not record a GPU run or certify these outcomes.</p></article>`,
          )
          .join(""),
    );
    on("[data-study-path]", "click", async (event) => {
      const id = (event.currentTarget as HTMLElement).dataset.studyPath!;
      if (!studyPaths.some((path) => path.id === id)) return;
      p().studyPath = id;
      if (await c.save()) {
        pathsPage();
        c.toast("Study path saved. Recommendations now follow this path.");
      }
    });
  }
  function review() {
    const due = reviewList();
    c.shell(
      "review",
      c.heading(
        "ADVANCED SPACED RETRIEVAL",
        "Keep the mechanism available.",
        "Your self-assessments schedule concept and interview retrieval. A clear queue is a good place to stop.",
      ) +
        (due.length
          ? `<div class="knowledge-grid">${due.map((k) => articleCard(k, (p().cards["question:" + k.question.id]?.due ?? "9999-12-31") <= day())).join("")}</div>`
          : `<article class="panel"><h2>No advanced reviews due.</h2><p>Attempt a technical explanation or interview question to schedule a review.</p>${a("knowledge", "Explore the knowledge base →", true)}</article>`) +
        `<p>${a("foundation-review", "Review coding and foundation cards →")}</p>`,
    );
  }
  return { home, library, detail, paths: pathsPage, review };
}
