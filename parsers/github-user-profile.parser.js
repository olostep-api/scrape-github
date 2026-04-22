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

function getMeta(doc, selector) {
  return getAttr(doc.querySelector(selector), "content");
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseProfile(htmlString, pageUrl) {
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
  const routeController = getMeta(doc, 'meta[name="route-controller"]');
  const ogType = getMeta(doc, 'meta[property="og:type"]');
  const username = getMeta(doc, 'meta[property="profile:username"]') || segments[0];

  if (
    url.hostname !== "github.com" ||
    segments.length !== 1 ||
    routeController !== "profiles" ||
    ogType !== "profile"
  ) {
    return { success: false, error: "Unsupported GitHub user profile page." };
  }

  const displayName = getText(doc.querySelector(".vcard-fullname"));
  const bio = getText(doc.querySelector(".user-profile-bio"));
  const company = getText(doc.querySelector('[itemprop="worksFor"]'));
  const locationName = getText(doc.querySelector('[itemprop="homeLocation"]'));
  const website = absoluteUrl(getAttr(doc.querySelector('[itemprop="url"] a, a[itemprop="url"]'), "href"));
  const joinDate =
    getAttr(doc.querySelector('relative-time[datetime]'), "datetime") ||
    getAttr(doc.querySelector('local-time[datetime]'), "datetime");

  const followers = parseCount(
    getText(doc.querySelector('a[href$="?tab=followers"] .text-bold, a[href$="?tab=followers"] span.text-bold'))
  );
  const following = parseCount(
    getText(doc.querySelector('a[href$="?tab=following"] .text-bold, a[href$="?tab=following"] span.text-bold'))
  );

  const pinnedRepositories = Array.from(doc.querySelectorAll("ol.pinned-items-reorder-list li")).map((item) => {
    const link = item.querySelector('a[href^="/"]');
    const language = getText(item.querySelector('[itemprop="programmingLanguage"]'));
    const stars = parseCount(getText(item.querySelector('a[href$="/stargazers"]')));
    return {
      name: getText(item.querySelector(".repo")),
      description: getText(item.querySelector(".pinned-item-desc")),
      language,
      stars,
      url: absoluteUrl(getAttr(link, "href"))
    };
  }).filter((repo) => repo.name);

  const socialLinks = uniqueStrings(
    Array.from(doc.querySelectorAll('.vcard-details [itemprop="social"] a')).map((node) => absoluteUrl(getAttr(node, "href")))
  );

  return {
    success: true,
    type: "user_profile",
    timestamp: new Date().toISOString(),
    url: url.toString(),
    username,
    displayName: displayName || null,
    bio: bio || null,
    followers,
    following,
    company: company || null,
    location: locationName || null,
    website,
    joinDate: joinDate || null,
    socialLinks,
    pinnedRepositories
  };
}

async function parse(htmlString, pageUrl) {
  try {
    return parseProfile(htmlString, pageUrl);
  } catch (error) {
    return { success: false, error: error.message };
  }
}
