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

function addSourceAlternatives(parent, source) {
  const seen = new Set([source.url]);
  for (const [url, label] of [
    [source.catalogUrl, source.catalogLabel || "Official catalog record"],
    [source.readingUrl, source.readingNote || "Alternate public reading copy"],
  ]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const row = element("p");
    row.append(link(label, url));
    parent.append(row);
  }
  addText(parent, "p", source.linkNote, "meta");
}

function addSources(parent, ids, sources, includeAlternatives = true) {
  const citations = [...new Set(list(ids))].map(id => sources.get(id)).filter(Boolean);
  if (!citations.length) return;
  const section = element("div", null, "sources meta");
  const items = element("ul");
  section.append(element("p", "Sources"), items);
  for (const source of citations) {
    const item = element("li");
    item.append(link(sourceLabel(source), source.url));
    if (includeAlternatives) addSourceAlternatives(item, source);
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

function initCourseStudy(data, sources, progress) {
  const objectiveCoverage = page === "soldier";
  const courseSelect = byId("course-select");
  const lessonSelect = byId("lesson-select");
  const lessonTitle = byId("lesson-title");
  const lessonContent = byId("lesson-content");
  const complete = byId("complete-lesson");
  const scope = byId("practice-scope");
  const coverageSelect = byId("coverage-course");
  const courseMap = new Map(data.courses.map(item => [item.id, item]));
  const lessonMap = new Map(data.lessons.map(item => [item.id, item]));
  const courseLessons = new Map(data.courses.map(item => [item.id, data.lessons.filter(part => part.courseId === item.id)]));
  const courseCards = new Map();
  const lessonCards = new Map(data.lessons.map(item => [item.id, list(item.questions).map(question => ({
    id: `${item.id}:${question.id ?? question.prompt}`,
    context: [courseMap.get(item.courseId).title, item.title].join(" · "),
    prompt: question.prompt,
    answer: question.answer,
    sourceIds: question.sourceIds ?? item.sourceIds,
    sourceLocator: question.sourceLocator ?? item.sourceLocator,
  }))]));
  const allCards = [...lessonCards.values()].flat();
  function lessonFromAddress() {
    const query = new URLSearchParams(location.search);
    const requested = lessonMap.get(query.get("lesson"));
    const selected = courseMap.get(query.get("course")) ?? data.courses[0];
    return requested ?? courseLessons.get(selected.id)[0];
  }
  let lesson = lessonFromAddress();
  let course = courseMap.get(lesson.courseId);
  const manuals = data.courses.filter(item => item.kind !== "orientation");

  function editionBadge(item) {
    const labels = {
      "verified-edition": ["Reading edition checked", ""],
      "prior-edition": ["Earlier reading edition", "reading"],
      "catalog-only": ["Current text unverified", "pending"],
    };
    const [text, style] = labels[item.sourceStatus] ?? ["Start here", ""];
    return element("span", text, `badge ${style}`.trim());
  }
  function addCourseContext(parent, item) {
    parent.replaceChildren();
    addText(parent, "p", item.description);
    addText(parent, "p", item.verifiedEdition ? `Reading edition: ${item.verifiedEdition}` : item.edition, "meta");
    if (item.note) addText(parent, "p", item.note, "notice");
    for (const note of list(item.limitations)) addText(parent, "p", note, "notice");
    if (item.sourceId) addSources(parent, [item.sourceId], sources);
    const source = sources.get(item.sourceId);
    if (source?.readingUrl) parent.append(link(source.readingNote || "Alternate public reading copy", source.readingUrl));
  }
  function lessonLink(item, text = item.title) {
    const anchor = element("a", text);
    anchor.href = `?course=${encodeURIComponent(item.courseId)}&lesson=${encodeURIComponent(item.id)}#lesson-reader`;
    anchor.addEventListener("click", event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectLesson(item.id, true);
    });
    return anchor;
  }
  function updateAddress() {
    const address = new URL(location.href);
    address.searchParams.set("course", course.id);
    address.searchParams.set("lesson", lesson.id);
    address.hash = "lesson-reader";
    history.replaceState(null, "", address);
  }
  function renderCompletion() {
    const completed = data.lessons.filter(item => progress.completed(item.id)).length;
    byId("lesson-progress").textContent = `${completed} of ${data.lessons.length} lessons complete`;
    for (const item of data.courses) {
      const items = courseLessons.get(item.id);
      const count = items.filter(part => progress.completed(part.id)).length;
      const card = courseCards.get(item.id);
      card.progress.textContent = `${count} of ${items.length} lessons complete`;
      card.element.setAttribute("aria-current", String(course.id === item.id));
    }
    const selected = courseLessons.get(course.id);
    const count = selected.filter(item => progress.completed(item.id)).length;
    byId("course-progress").textContent = `${count} of ${selected.length} complete in this course`;
    for (const option of lessonSelect.options) {
      const item = lessonMap.get(option.value);
      option.textContent = item.title + (progress.completed(item.id) ? " · Complete" : "");
    }
    const done = progress.completed(lesson.id);
    complete.textContent = done ? "Mark lesson incomplete" : "Mark lesson complete";
  }
  function renderLesson() {
    const items = courseLessons.get(course.id);
    const position = items.indexOf(lesson);
    const words = list(lesson.sections).map(section => section.text).join(" ").split(/\s+/).length;
    byId("lesson-position").textContent = [
      `Lesson ${position + 1} of ${items.length}`,
      `${Math.max(1, Math.ceil(words / 200))} min read`,
      lesson.level,
    ].filter(Boolean).join(" · ");
    lessonTitle.textContent = lesson.title;
    lessonContent.replaceChildren();
    addText(lessonContent, "p", lesson.summary, "lesson-summary");
    if (list(lesson.objectives).length) {
      const objectives = element("div", null, "lesson-objectives");
      objectives.append(element("h4", "After this lesson"));
      const items = element("ul");
      for (const objective of lesson.objectives) items.append(element("li", objective));
      objectives.append(items);
      lessonContent.append(objectives);
    }
    for (const section of list(lesson.sections)) {
      addText(lessonContent, "h4", section.heading);
      addText(lessonContent, "p", section.text);
    }
    if (list(lesson.terms).length) {
      addText(lessonContent, "h4", "Key terms");
      addText(lessonContent, "p", lesson.terms.join(" · "));
    }
    addText(lessonContent, "p", lesson.sourceLocator ? `Source reading: ${lesson.sourceLocator}` : "", "meta");
    addSources(lessonContent, lesson.sourceIds, sources);
    byId("previous-lesson").disabled = position === 0;
    byId("next-lesson").disabled = position === items.length - 1;
    renderCompletion();
  }
  function renderCourse() {
    courseSelect.value = course.id;
    lessonSelect.replaceChildren();
    for (const item of courseLessons.get(course.id)) lessonSelect.add(new Option(item.title, item.id));
    lessonSelect.value = lesson.id;
    addCourseContext(byId("course-context"), course);
    byId("course-map-link").hidden = course.kind === "orientation";
  }
  function selectLesson(id, focus = false, writeAddress = true) {
    const next = lessonMap.get(id);
    if (!next) return;
    lesson = next;
    course = courseMap.get(lesson.courseId);
    renderCourse();
    renderLesson();
    renderPractice();
    if (writeAddress) updateAddress();
    if (focus) {
      lessonTitle.focus({ preventScroll: true });
      byId("lesson-reader").scrollIntoView({ block: "start" });
    }
  }

  const catalog = byId("course-list");
  for (const item of data.courses) {
    courseSelect.add(new Option(item.title, item.id));
    const card = element("article", null, "panel course-card");
    card.dataset.course = item.id;
    addText(card, "p", item.code || "Foundations", "eyebrow");
    const title = element("h3");
    title.append(lessonLink(courseLessons.get(item.id)[0], item.title));
    card.append(title);
    if (!objectiveCoverage) card.append(editionBadge(item));
    addText(card, "p", item.description);
    addText(card, "p", item.verifiedEdition || item.edition, "meta");
    const status = element("p", null, "meta course-card-progress");
    card.append(status);
    if (!objectiveCoverage) {
      card.append(lessonLink(courseLessons.get(item.id)[0], item.kind === "orientation" ? "Start foundations" : `Open ${item.code}`));
    }
    courseCards.set(item.id, { element: card, progress: status });
    catalog.append(card);
  }
  const courseCount = objectiveCoverage ? `${data.courses.length} courses` : `${manuals.length} publication courses + foundations`;
  byId("curriculum-stats").textContent = `${courseCount} · ${data.lessons.length} lessons · ${allCards.length} recall questions`;

  const renderPractice = initPractice(
    () => scope.value === "all" ? allCards : scope.value === "course"
      ? courseLessons.get(course.id).flatMap(item => lessonCards.get(item.id))
      : lessonCards.get(lesson.id),
    progress,
    (answer, card) => {
      addText(answer, "p", card.answer);
      addText(answer, "p", card.sourceLocator ? `Source reading: ${card.sourceLocator}` : "", "meta");
      addSources(answer, card.sourceIds, sources);
    },
  );
  courseSelect.addEventListener("change", () => selectLesson(courseLessons.get(courseSelect.value)[0].id));
  lessonSelect.addEventListener("change", () => selectLesson(lessonSelect.value));
  for (const [id, direction] of [["previous-lesson", -1], ["next-lesson", 1]]) {
    byId(id).addEventListener("click", () => {
      const items = courseLessons.get(course.id);
      const next = items[items.indexOf(lesson) + direction];
      if (next) selectLesson(next.id, true);
    });
  }
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
  renderCourse();
  renderLesson();
  window.addEventListener("popstate", () => {
    const selected = lessonFromAddress();
    if (selected.id !== lesson.id) selectLesson(selected.id, false, false);
  });

  const normalize = text => text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  const index = data.lessons.map(item => ({
    lesson: item,
    text: normalize([item.title, item.summary, courseMap.get(item.courseId).title,
      ...list(item.objectives), ...list(item.terms),
      ...list(item.sections).flatMap(section => [section.heading, section.text])].join(" ")),
  }));
  let matches = [];
  let visible = 0;
  function appendMatches() {
    for (const { lesson: item } of matches.slice(visible, visible + 20)) {
      const row = element("li");
      row.append(lessonLink(item));
      addText(row, "span", courseMap.get(item.courseId).title, "meta");
      byId("topic-matches").append(row);
    }
    visible = Math.min(visible + 20, matches.length);
    byId("topic-count").textContent = matches.length
      ? `Showing ${visible} of ${matches.length} matching ${plural(matches.length, "lesson")}`
      : "No lessons match this search. Try a broader term.";
    byId("more-topics").hidden = visible >= matches.length;
  }
  byId("topic-search").addEventListener("input", event => {
    const words = normalize(event.target.value.trim()).split(/\s+/).filter(Boolean);
    byId("topic-results").hidden = !words.length;
    byId("topic-matches").replaceChildren();
    visible = 0;
    matches = words.length ? index.filter(item => words.every(word => item.text.includes(word))) : [];
    appendMatches();
  });
  byId("more-topics").addEventListener("click", () => {
    const firstNew = visible;
    appendMatches();
    byId("topic-matches").children[firstNew]?.querySelector("a").focus();
  });

  const coverageLabels = {
    lesson: ["Lesson + source reading", ""],
    "guided-reading": ["Guided source reading", "reading"],
    unverified: [objectiveCoverage ? "Blocked pending verification" : "Awaiting verification", "pending"],
    taught: ["Taught", ""],
    partial: ["Partially taught", "reading"],
    "assigned-reading": ["Assigned reading", "reading"],
    practical: ["Practical training", "reading"],
    excluded: ["Excluded", "pending"],
  };
  for (const item of manuals) coverageSelect.add(new Option(item.title, item.id));
  function renderCoverage() {
    const selected = courseMap.get(coverageSelect.value);
    const units = list(selected.units);
    addCourseContext(byId("coverage-context"), selected);
    const taught = units.filter(unit => unit.status === "lesson").length;
    const guided = units.filter(unit => unit.status === "guided-reading").length;
    const unverified = units.filter(unit => unit.status === "unverified").length;
    if (objectiveCoverage) {
      const counts = Object.entries(coverageLabels).flatMap(([status, [label]]) => {
        const count = units.filter(unit => unit.status === status).length;
        return count ? [`${count} ${label.toLowerCase()}`] : [];
      });
      byId("coverage-summary").textContent = [`${units.length} objectives mapped`, ...counts].join(" · ");
    } else {
      byId("coverage-summary").textContent = `${units.length} chapters and appendices mapped · ${taught} with lessons · ${guided} guided reading · ${unverified} awaiting verification`;
    }
    const container = byId("coverage-units");
    container.replaceChildren();
    for (const unit of units) {
      const details = element("details", null, "reference-entry coverage-unit");
      const summary = element("summary");
      summary.append(element("span", [unit.label, unit.title].filter(Boolean).join(" — "), "reference-term"));
      const [label, style] = coverageLabels[unit.status] ?? coverageLabels.unverified;
      summary.append(element("span", label, `badge ${style}`.trim()));
      const body = element("div", null, "reference-detail");
      addText(body, "p", unit.locator, "meta");
      if (list(unit.taskIds).length) addText(body, "p", "Task IDs: " + unit.taskIds.join(", "), "meta");
      if (list(unit.topics).length) {
        addText(body, "h4", "Topics to account for");
        const topics = element("ul");
        for (const topic of unit.topics) topics.append(element("li", topic));
        body.append(topics);
      }
      addText(body, "p", unit.note);
      addText(body, "p", unit.readingObjective ? `Reading objective: ${unit.readingObjective}` : "");
      if (list(unit.lessonIds).length) {
        addText(body, "h4", "Study on this site");
        const lessons = element("ul");
        for (const id of unit.lessonIds) {
          const item = lessonMap.get(id);
          if (!item) continue;
          const row = element("li");
          row.append(lessonLink(item));
          lessons.append(row);
        }
        body.append(lessons);
      }
      const source = sources.get(selected.sourceId);
      if (objectiveCoverage) {
        addSources(body, unit.sourceIds, sources);
      } else if (source) {
        body.append(link("Open the source reading", source.url));
        addSourceAlternatives(body, source);
      }
      details.append(summary, body);
      container.append(details);
    }
  }
  coverageSelect.value = course.kind === "orientation" ? manuals[0].id : course.id;
  coverageSelect.addEventListener("change", renderCoverage);
  byId("course-map-link").addEventListener("click", () => {
    coverageSelect.value = course.id;
    renderCoverage();
    byId("coverage-heading").focus({ preventScroll: true });
  });
  renderCoverage();

  const publications = byId("publication-list");
  for (const publication of list(data.publications)) {
    const item = element("article", null, "publication");
    addText(item, "h3", [publication.code, publication.title].filter(Boolean).join(" — "));
    addText(item, "p", [publication.edition, publication.access].filter(Boolean).join(" · "), "meta");
    addText(item, "p", publication.note);
    if (publication.url) item.append(link(`Open ${publication.code || publication.title}`, publication.url));
    if (publication.readingUrl) {
      const alternate = element("p");
      alternate.append(link(publication.readingNote || "Alternate public reading copy", publication.readingUrl));
      item.append(alternate);
    }
    if (publication.catalogUrl) {
      const catalog = element("p");
      catalog.append(link("Official catalog record", publication.catalogUrl));
      item.append(catalog);
    }
    addSources(item, publication.sourceIds, sources, false);
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
  const areas = {
    acronyms: { material: "the acronym reference", key: "army-acronyms.progress.v1", resetName: "acronym study" },
    ew: { material: "EW lessons and publications", key: "ew-study.progress.v1", resetName: "EW study" },
    soldier: { material: "Soldier Study lessons and publications", key: "soldier-study.progress.v1", resetName: "Soldier Study" },
  };
  const { material, key, resetName } = areas[page];
  const wasRetry = !retry.hidden;
  status.textContent = `Loading ${material}…`;
  retry.hidden = true;
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("Could not fetch study material");
    const data = await response.json();
    if (!list(acronyms ? data?.entries : data?.lessons).length) throw new Error("Study material is empty");
    if (!acronyms) {
      const courses = list(data.courses);
      const ids = new Set(courses.map(item => item.id));
      if (!courses.length || courses.some(item => !data.lessons.some(lesson => lesson.courseId === item.id))
        || data.lessons.some(lesson => !ids.has(lesson.courseId))) throw new Error("Course content is incomplete");
    }
    const sources = new Map(list(data.sources).map(source => [source.id, source]));
    const progress = createProgress(key);
    const refresh = acronyms ? initAcronyms(data, sources, progress) : initCourseStudy(data, sources, progress);
    byId("reset-progress").onclick = () => {
      if (!window.confirm(`Reset your ${resetName} progress in this browser?`)) return;
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
