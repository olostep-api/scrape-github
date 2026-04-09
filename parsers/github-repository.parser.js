function getText(node) {
  return node ? node.textContent.replace(/\s+/g, " ").trim() : null;
}

function getAttr(node, attr) {
  if (!node) return null;
  const value = node.getAttribute(attr);
  return value ? value.trim() : null;
}

function parseCount(value) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const match = normalized.match(/^([\d.]+)([km])?$/);
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

function getMeta(doc, selector) {
  return getAttr(doc.querySelector(selector), "content");
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
    getMeta(doc, 'meta[property="og:url"]') ||
    (typeof location !== "undefined" ? location.href : null);

  let url;
  try {
    url = new URL(canonicalUrl);
  } catch {
    return { success: false, error: "Unable to determine canonical URL." };
  }

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
  const titleParts = (getText(doc.querySelector("title")) || "").split(":");
  const description =
    getMeta(doc, 'meta[property="og:description"]') ||
    getMeta(doc, 'meta[name="description"]') ||
    getText(doc.querySelector('meta[name="description"]'));
  const primaryLanguage =
    getText(doc.querySelector('[itemprop="programmingLanguage"]')) ||
    getText(doc.querySelector('span[itemprop="programmingLanguage"]'));
  const topics = uniqueStrings(
    Array.from(doc.querySelectorAll('a[data-view-component="true"][href*="/topics/"], a.topic-tag'))
      .map((node) => getText(node))
  );
  const readmeSummary = getText(
    doc.querySelector("article.markdown-body p, article.markdown-body h1, article.markdown-body h2")
  );

  const socialCounts = Array.from(
    doc.querySelectorAll('a[href$="/stargazers"], a[href$="/forks"], a[href$="/watchers"]')
  );
  const stars = parseCount(getText(socialCounts.find((node) => /\/stargazers$/.test(node.getAttribute("href") || ""))));
  const forks = parseCount(getText(socialCounts.find((node) => /\/forks$/.test(node.getAttribute("href") || ""))));
  const watchers = parseCount(getText(socialCounts.find((node) => /\/watchers$/.test(node.getAttribute("href") || ""))));

  const licenseNode = Array.from(doc.querySelectorAll("a, span")).find((node) => {
    const href = node.getAttribute("href") || "";
    return href.includes("/LICENSE") || /license/i.test(getText(node) || "");
  });

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
    readmeSummary: readmeSummary || null,
    pageTitle: titleParts[0] ? titleParts[0].trim() : null
  };
}

async function parse(htmlString, pageUrl) {
  try {
    return parseRepository(htmlString, pageUrl);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
