function getText(node) {
  return node ? node.textContent.replace(/\s+/g, " ").trim() : null;
}

function getAttr(node, attr) {
  if (!node) return null;
  const value = node.getAttribute(attr);
  return value ? value.trim() : null;
}

function getMeta(doc, selector) {
  return getAttr(doc.querySelector(selector), "content");
}

function parseCount(value) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const match =
    normalized.match(/^([\d.]+)\s*([km])?$/) ||
    normalized.match(/([\d.]+)\s*([km])?(?=\s*(stars?|forks?|watch(?:ing|ers)?|followers?|following|$))/);
  if (!match) return null;
  const number = Number(match[1]);
  if (Number.isNaN(number)) return null;
  if (match[2] === "k") return Math.round(number * 1000);
  if (match[2] === "m") return Math.round(number * 1000000);
  return Math.round(number);
}

function absoluteUrl(url) {
  if (!url) return null;
  try {
    return new URL(url, "https://github.com").toString();
  } catch {
    return null;
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseRepository(htmlString, pageUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const canonicalUrl =
    pageUrl ||
    getAttr(doc.querySelector('link[rel="canonical"]'), "href") ||
    getMeta(doc, 'meta[property="og:url"]');

  const url = new URL(canonicalUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const repoId = getMeta(doc, 'meta[name="octolytics-dimension-repository_id"]');
  const routePattern = getMeta(doc, 'meta[name="route-pattern"]');

  if (
    url.hostname !== "github.com" ||
    segments.length !== 2 ||
    !repoId ||
    routePattern !== "/:user_id/:repository"
  ) {
    return { success: false, error: "Unsupported GitHub repository page." };
  }

  const owner = segments[0];
  const name = segments[1];
  const description =
    getMeta(doc, 'meta[property="og:description"]') ||
    getMeta(doc, 'meta[name="description"]');
  const primaryLanguage = getText(doc.querySelector('[itemprop="programmingLanguage"]'));
  const topics = uniqueStrings(
    Array.from(doc.querySelectorAll('a[data-view-component="true"][href*="/topics/"], a.topic-tag'))
      .map((node) => getText(node))
  );
  const stars = parseCount(
    getText(doc.querySelector('a[href$="/stargazers"]'))
  );
  const forks = parseCount(
    getText(doc.querySelector('a[href$="/forks"]'))
  );
  const watchers = parseCount(
    getText(doc.querySelector('a[href$="/watchers"]'))
  );
  const licenseNode = Array.from(doc.querySelectorAll("a, span")).find((node) => {
    const href = node.getAttribute("href") || "";
    return href.includes("/LICENSE") || /license/i.test(getText(node) || "");
  });
  const readmeSummary = getText(
    doc.querySelector("#readme article.markdown-body p, #readme article.markdown-body h1, #readme article.markdown-body h2, article.markdown-body p, article.markdown-body h1, article.markdown-body h2, .js-snippet-clipboard-copy-unpositioned pre")
  ) || getText(doc.querySelector("#readme .markdown-body, #readme .Box-body, #readme, article.markdown-body, .markdown-body, .js-snippet-clipboard-copy-unpositioned"));

  return {
    success: true,
    type: "repository",
    timestamp: new Date().toISOString(),
    url: url.toString(),
    owner,
    name,
    fullName: `${owner}/${name}`,
    description: description || null,
    primaryLanguage: primaryLanguage || null,
    stars,
    forks,
    watchers,
    license: getText(licenseNode),
    topics,
    readmeSummary: readmeSummary || null
  };
}

function parseUserProfile(htmlString, pageUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const canonicalUrl =
    pageUrl ||
    getAttr(doc.querySelector('link[rel="canonical"]'), "href") ||
    getMeta(doc, 'meta[property="og:url"]');

  const url = new URL(canonicalUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const routeController = getMeta(doc, 'meta[name="route-controller"]');
  const ogType = getMeta(doc, 'meta[property="og:type"]');

  if (
    url.hostname !== "github.com" ||
    segments.length !== 1 ||
    routeController !== "profiles" ||
    ogType !== "profile"
  ) {
    return { success: false, error: "Unsupported GitHub user profile page." };
  }

  const username = getMeta(doc, 'meta[property="profile:username"]') || segments[0];
  const pinnedRepositories = Array.from(doc.querySelectorAll("ol.pinned-items-reorder-list li"))
    .map((item) => {
      const link = item.querySelector('a[href^="/"]');
      return {
        name: getText(item.querySelector(".repo")),
        description: getText(item.querySelector(".pinned-item-desc")),
        language: getText(item.querySelector('[itemprop="programmingLanguage"]')),
        stars: parseCount(getText(item.querySelector('a[href$="/stargazers"]'))),
        url: absoluteUrl(getAttr(link, "href"))
      };
    })
    .filter((repo) => repo.name);

  return {
    success: true,
    type: "user_profile",
    timestamp: new Date().toISOString(),
    url: url.toString(),
    username,
    displayName: getText(doc.querySelector(".vcard-fullname")),
    bio: getText(doc.querySelector(".user-profile-bio")),
    followers: parseCount(getText(doc.querySelector('a[href$="?tab=followers"] .text-bold'))),
    following: parseCount(getText(doc.querySelector('a[href$="?tab=following"] .text-bold'))),
    company: getText(doc.querySelector('[itemprop="worksFor"]')),
    location: getText(doc.querySelector('[itemprop="homeLocation"]')),
    website: absoluteUrl(getAttr(doc.querySelector('[itemprop="url"] a, a[itemprop="url"]'), "href")),
    joinDate:
      getAttr(doc.querySelector('relative-time[datetime]'), "datetime") ||
      getAttr(doc.querySelector('local-time[datetime]'), "datetime"),
    socialLinks: uniqueStrings(
      Array.from(doc.querySelectorAll('.vcard-details [itemprop="social"] a')).map((node) =>
        absoluteUrl(getAttr(node, "href"))
      )
    ),
    pinnedRepositories
  };
}

export function detectGitHubPageType(urlString) {
  try {
    const url = new URL(urlString);
    if (url.hostname !== "github.com") {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 1 && !url.search) {
      return "user_profile";
    }
    if (segments.length === 2 && !url.search) {
      return "repository";
    }
    return null;
  } catch {
    return null;
  }
}

export function parseGitHubPage(pageType, htmlString, url) {
  if (pageType === "repository") {
    return parseRepository(htmlString, url);
  }
  if (pageType === "user_profile") {
    return parseUserProfile(htmlString, url);
  }
  return { success: false, error: "Unsupported page type." };
}
