/*
 * Small progressive enhancements for the site: post search and, later,
 * the back-to-top control. Every feature must degrade gracefully without JS.
 */
(() => {
  "use strict";

  const isMac = /Mac|iPhone|iPad|iPod/.test(
    navigator.platform || navigator.userAgent,
  );

  document.querySelectorAll("[data-kbd]").forEach((node) => {
    node.textContent = isMac ? "⌘ K" : "Ctrl K";
  });

  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 400);
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });
  }

  const dialog = document.getElementById("search-dialog");
  if (!dialog) return;

  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  const closeButton = dialog.querySelector("[data-search-close]");
  const triggers = [...document.querySelectorAll("[data-search-open]")];

  let posts = [];
  let indexState = "idle";
  let indexPromise = null;
  let activeIndex = -1;
  let currentResults = [];
  let lastFocused = null;

  const normalize = (value = "") =>
    String(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");

  const tokenize = (value = "") =>
    normalize(value).split(/\s+/).filter(Boolean);

  function loadIndex() {
    if (indexPromise) return indexPromise;

    indexState = "loading";
    status.textContent = "Loading search index…";

    indexPromise = fetch("/search-index.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        posts = Array.isArray(data) ? data : [];
        indexState = "ready";
        return posts;
      })
      .catch(() => {
        indexState = "error";
        posts = [];
        status.textContent =
          "Search is unavailable right now. Browse the posts archive instead.";
        return posts;
      });

    return indexPromise;
  }

  function scorePost(post, terms, phrase) {
    const title = normalize(post.title);
    const summary = normalize(post.summary);
    const category = normalize((post.categories || []).join(" "));
    const tags = normalize((post.tags || []).join(" "));
    const text = normalize(post.text);
    const haystack = `${title} ${summary} ${category} ${tags} ${text}`;

    if (!terms.every((term) => haystack.includes(term))) return -1;

    let score = 0;
    if (phrase && title.includes(phrase)) score += 30;

    for (const term of terms) {
      if (title.includes(term)) score += 12;
      if (tags.includes(term)) score += 6;
      if (category.includes(term)) score += 5;
      if (summary.includes(term)) score += 4;
      if (text.includes(term)) score += 1;
    }

    return score;
  }

  function setActive(index) {
    const nodes = [...results.querySelectorAll(".search-result")];
    if (!nodes.length) return;

    activeIndex = (index + nodes.length) % nodes.length;

    nodes.forEach((node, nodeIndex) => {
      node.classList.toggle("is-active", nodeIndex === activeIndex);
    });

    nodes[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function render(query = "") {
    results.replaceChildren();
    currentResults = [];
    activeIndex = -1;

    if (indexState === "idle" || indexState === "loading") {
      status.textContent = "Loading search index…";
      return;
    }

    if (indexState === "error") {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "Search is unavailable right now.";
      results.append(empty);
      return;
    }

    const terms = tokenize(query);
    const phrase = normalize(query).trim();

    if (!terms.length) {
      currentResults = posts.slice(0, 6);
      status.textContent = `${posts.length} posts indexed. Start typing.`;
    } else {
      const matches = posts
        .map((post) => ({ post, score: scorePost(post, terms, phrase) }))
        .filter((entry) => entry.score >= 0)
        .sort(
          (a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date),
        );

      currentResults = matches.slice(0, 10).map((entry) => entry.post);
      status.textContent = matches.length
        ? matches.length > currentResults.length
          ? `Showing ${currentResults.length} of ${matches.length} results for “${query.trim()}”`
          : `${matches.length} result${matches.length === 1 ? "" : "s"} for “${query.trim()}”`
        : `No posts found for “${query.trim()}”`;
    }

    if (!currentResults.length) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent =
        "Nothing matched. Try a broader term, a tag, or a category.";
      results.append(empty);
      return;
    }

    currentResults.forEach((post, index) => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = post.url;
      link.dataset.resultIndex = String(index);
      link.setAttribute("role", "listitem");

      const top = document.createElement("span");
      top.className = "search-result-top";

      const category = document.createElement("span");
      category.className = "search-result-category";
      category.textContent = (post.categories && post.categories[0]) || "Post";

      const date = document.createElement("span");
      date.textContent = post.dateLabel;

      top.append(category, date);

      const title = document.createElement("span");
      title.className = "search-result-title";
      title.textContent = post.title;

      const summary = document.createElement("span");
      summary.className = "search-result-summary";
      summary.textContent = post.summary || "";

      link.append(top, title, summary);
      results.append(link);
    });
  }

  function openSearch() {
    if (dialog.open) return;

    lastFocused = document.activeElement;
    document.body.classList.add("search-open");
    dialog.showModal();
    input.value = "";
    render("");
    loadIndex().then(() => render(input.value));
    window.setTimeout(() => input.focus(), 20);
  }

  function closeSearch() {
    if (dialog.open) dialog.close();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openSearch();
    });

    // Warm the index on intent, not on page load.
    trigger.addEventListener("pointerenter", loadIndex, { once: true });
    trigger.addEventListener("focus", loadIndex, { once: true });
  });

  closeButton.addEventListener("click", closeSearch);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeSearch();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("search-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  });

  input.addEventListener("input", () => render(input.value));

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      const nodes = [...results.querySelectorAll(".search-result")];
      const target = nodes[activeIndex] || (nodes.length === 1 ? nodes[0] : null);
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) closeSearch();
      else openSearch();
    } else if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      closeSearch();
    }
  });
})();
