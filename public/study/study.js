const page = document.body.dataset.study;
const byId = id => document.getElementById(id);
const list = value => Array.isArray(value) ? value : [];
const plural = (count, word) => count === 1 ? word : word + "s";

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function addText(parent, tag, text, className) {
  if (text) parent.append(element(tag, text, className));
}

function sourceLabel(source) {
  return [source.title, source.edition, source.locator].filter(Boolean).join(" · ");
}

function link(text, url) {
  if (url) {
    try {
      const address = new URL(url, document.baseURI);
      if (address.protocol === "https:" || address.protocol === "http:") {
        const anchor = element("a", text);
        anchor.href = address.href;
        return anchor;
      }
    } catch {
      // A malformed URL can still be displayed as a plain citation.
    }
  }
  return element("span", text);
}

function addSources(parent, ids, sources) {
  const citations = [...new Set(list(ids))].map(id => sources.get(id)).filter(Boolean);
  if (!citations.length) return;
  const section = element("div", null, "sources meta");
  const items = element("ul");
  section.append(element("p", "Sources"), items);
  for (const source of citations) {
    const item = element("li");
    item.append(link(sourceLabel(source), source.url));
    items.append(item);
  }
  parent.append(section);
}

function addAcronymDetail(parent, entry, sources) {
  addText(parent, "p", entry.meaning);
  if (list(entry.components).length) {
    const items = element("ul");
    for (const component of entry.components) {
      items.append(element("li", [component.letter, component.meaning].filter(Boolean).join(" — ")));
    }
    parent.append(items);
  }
  addText(parent, "p", entry.note);
  addSources(parent, entry.sourceIds, sources);
}

function createProgress(key) {
  const status = byId("storage-status");
  const blank = () => ({ ratings: Object.create(null), completed: Object.create(null) });
  let state = blank();
  let pending = [];
  let resetPending = false;
  function warn(message) {
    status.textContent = message;
    status.hidden = false;
  }
  function decode(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid progress");
    const progress = blank();
    for (const [id, rating] of Object.entries(parsed.ratings ?? {})) {
      if (rating === "review" || rating === "got-it") progress.ratings[id] = rating;
    }
    for (const [id, complete] of Object.entries(parsed.completed ?? {})) {
      if (complete === true) progress.completed[id] = true;
    }
    return progress;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) state = decode(raw);
  } catch {
    warn("Saved progress is unavailable. You can still study and track progress while this page is open.");
  }
  function update(change) {
    change(state);
    pending.push(change);
    try {
      const raw = localStorage.getItem(key);
      let latest = blank();
      if (raw !== null && !resetPending) {
        try {
          latest = decode(raw);
        } catch {
          // Replace invalid progress with the in-memory state after a study action.
        }
      }
      for (const apply of pending) apply(latest);
      localStorage.setItem(key, JSON.stringify(latest));
      state = latest;
      pending = [];
      resetPending = false;
      status.hidden = true;
    } catch {
      warn("This browser could not save your progress. You can keep studying while this page is open.");
    }
  }
  return {
    rating: id => state.ratings[id],
    completed: id => state.completed[id] === true,
    rate: (id, rating) => update(progress => { progress.ratings[id] = rating; }),
    complete: (id, value) => update(progress => {
      if (value) progress.completed[id] = true;
      else delete progress.completed[id];
    }),
    reset() {
      state = blank();
      pending = [];
      resetPending = true;
      try {
        localStorage.removeItem(key);
        resetPending = false;
        status.hidden = true;
      } catch {
        warn("Progress was cleared for this visit. The browser did not allow us to clear saved progress.");
      }
    },
  };
}

function initPractice(getDeck, progress, renderAnswer) {
  const filter = byId("practice-filter");
  const summary = byId("practice-summary");
  const empty = byId("card-empty");
  const card = byId("recall-card");
  const context = byId("card-context");
  const prompt = byId("card-prompt");
  const answer = byId("card-answer");
  const ratings = byId("card-ratings");
  const reveal = byId("reveal-answer");
  let current;

  function render(advance = false, focus = false) {
    const scopedCards = getDeck();
    const marked = scopedCards.filter(item => progress.rating(item.id) === "review");
    const gotIt = scopedCards.filter(item => progress.rating(item.id) === "got-it").length;
    const deck = filter.value === "review" ? marked : scopedCards;
    summary.textContent = `${deck.length} ${plural(deck.length, "card")} · ${marked.length} marked for review · ${gotIt} rated Got it`;

    const index = deck.findIndex(item => item.id === current?.id);
    const next = index < 0 ? 0 : index + Number(advance);
    current = deck.length ? deck[next % deck.length] : undefined;
    card.hidden = !current;
    empty.hidden = Boolean(current);
    if (!current) {
      empty.textContent = scopedCards.length
        ? "No cards are marked for review here. Choose All cards to keep practicing."
        : "There are no recall cards in this selection.";
      if (focus) filter.focus({ preventScroll: true });
      return;
    }

    context.textContent = current.context ?? "";
    prompt.textContent = current.prompt;
    answer.replaceChildren();
    answer.hidden = true;
    ratings.hidden = true;
    reveal.hidden = false;
    reveal.setAttribute("aria-expanded", "false");
    if (focus) prompt.focus({ preventScroll: true });
  }

  reveal.addEventListener("click", () => {
    if (!current || !answer.hidden) return;
    renderAnswer(answer, current);
    answer.hidden = false;
    ratings.hidden = false;
    reveal.setAttribute("aria-expanded", "true");
    reveal.hidden = true;
    answer.focus({ preventScroll: true });
  });
  function rate(rating) {
    if (!current || answer.hidden) return;
    progress.rate(current.id, rating);
    render(true, true);
  }
  byId("review-again").addEventListener("click", () => rate("review"));
  byId("got-it").addEventListener("click", () => rate("got-it"));
  byId("skip-card").addEventListener("click", () => render(true, true));
  filter.addEventListener("change", () => render());
  render();

  return render;
}

function initAcronyms(data, sources, progress) {
  const search = byId("search");
  const category = byId("category");
  const count = byId("reference-count");
  const notices = byId("reference-notices");
  const results = byId("reference-results");
  const showMore = byId("show-more");
  const entries = [...data.entries].sort((a, b) => a.term.localeCompare(b.term, "en", { numeric: true }));
  const categories = [...new Set(entries.map(entry => entry.category).filter(Boolean))].sort();
  for (const name of categories) category.add(new Option(name, name));

  function normalize(text) {
    return text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  }
  const indexedEntries = entries.map(entry => ({
    entry,
    text: normalize([entry.term, entry.expansion, entry.category, entry.meaning, entry.note,
      ...list(entry.components).flatMap(component => [component.letter, component.meaning])].join(" ")),
  }));
  const pageSize = 18;
  let matches = [];
  let visible = 0;

  function appendResults() {
    const rows = matches.slice(visible, visible + pageSize);
    for (const { entry } of rows) {
      const details = element("details", null, "reference-entry");
      const summary = element("summary");
      summary.append(element("span", entry.term, "reference-term"));
      if (entry.expansion) summary.append(element("span", " — " + entry.expansion, "reference-title"));
      addText(summary, "small", entry.category, "meta");
      const detail = element("div", null, "reference-detail");
      addAcronymDetail(detail, entry, sources);
      details.append(summary, detail);
      results.append(details);
    }
    visible += rows.length;
    showMore.hidden = visible >= matches.length;
    count.textContent = matches.length
      ? `Showing ${visible} of ${matches.length} ${plural(matches.length, "term")}`
      : "No matching terms. Clear the search or choose another category.";
  }
  function filterReference() {
    const query = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const matchesQuery = text => query.every(word => text.includes(word));
    matches = indexedEntries.filter(({ entry, text }) =>
      (!category.value || entry.category === category.value) && matchesQuery(text));
    visible = 0;
    results.replaceChildren();
    notices.replaceChildren();
    if (!category.value) {
      for (const notice of list(data.notices)) {
        if (!matchesQuery(normalize([notice.term, notice.title, notice.text].join(" ")))) continue;
        const item = element("aside", null, "notice");
        addText(item, "strong", [notice.term, notice.title].filter(Boolean).join(" — "));
        addText(item, "p", notice.text);
        addSources(item, notice.sourceIds, sources);
        notices.append(item);
      }
    }
    appendResults();
  }
  showMore.addEventListener("click", () => {
    const firstNewRow = visible;
    appendResults();
    results.children[firstNewRow]?.querySelector("summary").focus();
  });
  search.addEventListener("input", filterReference);
  category.addEventListener("change", filterReference);
  filterReference();

  const deck = entries.filter(entry => entry.study !== false).map(entry => ({
    id: entry.id,
    context: entry.category,
    prompt: entry.prompt || `What does ${entry.term} stand for?`,
    entry,
  }));
  return initPractice(() => deck, progress, (answer, card) => {
    addText(answer, "strong", card.entry.expansion);
    addAcronymDetail(answer, card.entry, sources);
  });
}

function initEW(data, sources, progress) {
  const lessonSelect = byId("lesson-select");
  const lessonTitle = byId("lesson-title");
  const lessonContent = byId("lesson-content");
  const lessonProgress = byId("lesson-progress");
  const complete = byId("complete-lesson");
  const scope = byId("practice-scope");
  let lesson = data.lessons[0];
  const lessonCards = new Map();
  for (const item of data.lessons) {
    lessonSelect.add(new Option(item.title, item.id));
    lessonCards.set(item.id, list(item.questions).map(question => ({
      id: `${item.id}:${question.id ?? question.prompt}`,
      context: item.title,
      prompt: question.prompt,
      answer: question.answer,
      sourceIds: item.sourceIds,
    })));
  }
  const allCards = [...lessonCards.values()].flat();

  function renderCompletion() {
    const completed = data.lessons.filter(item => progress.completed(item.id)).length;
    lessonProgress.textContent = `${completed} of ${data.lessons.length} lessons complete`;
    const done = progress.completed(lesson.id);
    complete.textContent = done ? "Mark lesson incomplete" : "Mark lesson complete";
  }
  function renderLesson() {
    lessonTitle.textContent = lesson.title;
    lessonContent.replaceChildren();
    addText(lessonContent, "p", lesson.summary, "lesson-summary");
    for (const section of list(lesson.sections)) {
      addText(lessonContent, "h4", section.heading);
      addText(lessonContent, "p", section.text);
    }
    if (list(lesson.terms).length) {
      addText(lessonContent, "h4", "Key terms");
      addText(lessonContent, "p", lesson.terms.join(" · "));
    }
    addSources(lessonContent, lesson.sourceIds, sources);
    renderCompletion();
  }
  const renderPractice = initPractice(
    () => scope.value === "all" ? allCards : lessonCards.get(lesson.id),
    progress,
    (answer, card) => {
      addText(answer, "p", card.answer);
      addSources(answer, card.sourceIds, sources);
    },
  );
  lessonSelect.addEventListener("change", () => {
    lesson = data.lessons.find(item => item.id === lessonSelect.value);
    renderLesson();
    renderPractice();
  });
  scope.addEventListener("change", () => renderPractice());
  byId("practice-lesson").addEventListener("click", () => {
    scope.value = "selected";
    byId("practice-filter").value = "all";
    renderPractice();
    byId("practice-heading").focus({ preventScroll: true });
  });
  complete.addEventListener("click", () => {
    progress.complete(lesson.id, !progress.completed(lesson.id));
    renderCompletion();
  });
  renderLesson();

  const publications = byId("publication-list");
  for (const publication of list(data.publications)) {
    const item = element("article", null, "publication");
    addText(item, "h3", [publication.code, publication.title].filter(Boolean).join(" — "));
    addText(item, "p", [publication.edition, publication.access].filter(Boolean).join(" · "), "meta");
    addText(item, "p", publication.note);
    if (publication.url) item.append(link(`Open ${publication.code || publication.title}`, publication.url));
    addSources(item, publication.sourceIds, sources);
    publications.append(item);
  }
  if (!publications.hasChildNodes()) addText(publications, "p", "No publications are available.");
  return () => {
    renderCompletion();
    renderPractice();
  };
}

async function loadStudy() {
  const status = byId("load-status");
  const retry = byId("retry");
  const acronyms = page === "acronyms";
  const material = acronyms ? "the acronym reference" : "EW lessons and publications";
  const wasRetry = !retry.hidden;
  status.textContent = `Loading ${material}…`;
  retry.hidden = true;
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("Could not fetch study material");
    const data = await response.json();
    if (!list(acronyms ? data?.entries : data?.lessons).length) throw new Error("Study material is empty");
    const sources = new Map(list(data.sources).map(source => [source.id, source]));
    const key = acronyms ? "army-acronyms.progress.v1" : "ew-study.progress.v1";
    const progress = createProgress(key);
    const refresh = acronyms ? initAcronyms(data, sources, progress) : initEW(data, sources, progress);
    byId("reset-progress").onclick = () => {
      const name = acronyms ? "acronym" : "EW";
      if (!window.confirm(`Reset your ${name} study progress in this browser?`)) return;
      progress.reset();
      refresh();
    };
    if (data.updated) {
      byId("updated").textContent = `Content updated ${data.updated}`;
      byId("updated").hidden = false;
    }
    status.hidden = true;
    byId("study-content").hidden = false;
    if (wasRetry) byId(acronyms ? "reference-heading" : "lessons-heading").focus();
    if (location.hash) byId(location.hash.slice(1))?.scrollIntoView();
  } catch {
    status.textContent = `Could not load ${material}. Try loading again.`;
    retry.hidden = false;
    if (wasRetry) retry.focus();
  }
}

if (page) {
  byId("retry").addEventListener("click", loadStudy);
  loadStudy();
}
