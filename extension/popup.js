import { detectGitHubPageType, parseGitHubPage } from "./github-parsers.js";

const parseButton = document.getElementById("parse-button");
const copyButton = document.getElementById("copy-button");
const output = document.getElementById("output");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");

let lastResult = null;
let currentTab = null;
let currentPageType = null;

function setStatus(label, message) {
  statusBadge.textContent = label;
  statusText.textContent = message;
}

function setOutput(value) {
  output.textContent = value;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function readActiveTabHtml(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      html: document.documentElement.outerHTML,
      url: location.href
    })
  });

  return result.result;
}

async function refreshPageSupport() {
  currentTab = await getActiveTab();
  const url = currentTab?.url || "";
  currentPageType = detectGitHubPageType(url);

  if (!currentPageType) {
    parseButton.disabled = true;
    copyButton.disabled = true;
    setStatus("Unsupported", "Supported pages are GitHub repository roots and personal profile roots only.");
    setOutput("No parsed result yet.");
    return;
  }

  parseButton.disabled = false;
  copyButton.disabled = !lastResult;
  setStatus(
    currentPageType === "repository" ? "Repository" : "User profile",
    "This page is supported. Run the local parser to generate structured JSON."
  );
}

parseButton.addEventListener("click", async () => {
  if (!currentTab?.id || !currentPageType) {
    return;
  }

  parseButton.disabled = true;
  copyButton.disabled = true;
  setStatus("Parsing", "Reading the current page and running the parser locally.");
  setOutput("Parsing...");

  try {
    const { html, url } = await readActiveTabHtml(currentTab.id);
    const result = parseGitHubPage(currentPageType, html, url);
    lastResult = result;
    setOutput(JSON.stringify(result, null, 2));

    if (result.success) {
      setStatus("Success", "Structured JSON generated for the current page.");
      copyButton.disabled = false;
    } else {
      setStatus("Parser error", result.error || "Unable to parse this page.");
    }
  } catch (error) {
    lastResult = null;
    setStatus("Runtime error", error.message);
    setOutput(error.stack || error.message);
  } finally {
    parseButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  if (!lastResult) {
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
  setStatus("Copied", "JSON copied to the clipboard.");
});

refreshPageSupport();
