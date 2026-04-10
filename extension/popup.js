import { detectGitHubPageType, parseGitHubPage } from "./github-parsers.js";

const parseButton = document.getElementById("parse-button");
const copyButton = document.getElementById("copy-button");
const downloadJsonButton = document.getElementById("download-json-button");
const downloadCsvButton = document.getElementById("download-csv-button");
const formatJsonButton = document.getElementById("format-json");
const formatCsvButton = document.getElementById("format-csv");
const output = document.getElementById("output");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");

let lastResult = null;
let currentTab = null;
let currentPageType = null;
let outputFormat = "json";

function getOutputFormat() {
  return outputFormat === "csv" ? "csv" : "json";
}

function setStatus(label, message) {
  statusBadge.textContent = label;
  statusText.textContent = message;
}

function setOutput(value) {
  output.textContent = value;
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsvRow(values) {
  return values.map(escapeCsvCell).join(",");
}

function toCsv(result) {
  if (!result || typeof result !== "object") {
    return "";
  }

  const keys = Object.keys(result);
  const header = toCsvRow(keys);
  const row = toCsvRow(
    keys.map((key) => {
      const value = result[key];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value;
      }
      return JSON.stringify(value);
    })
  );

  return `${header}\n${row}\n`;
}

function getOutputText(format) {
  if (!lastResult) {
    return "No parsed result yet.";
  }
  if (format === "csv") {
    return toCsv(lastResult);
  }
  return JSON.stringify(lastResult, null, 2);
}

function getBaseFilename(result) {
  if (!result || !result.success) {
    return "github-parse";
  }
  if (result.type === "repository" && result.fullName) {
    return `github-repo-${result.fullName.replace("/", "__")}`;
  }
  if (result.type === "user_profile" && result.username) {
    return `github-user-${result.username}`;
  }
  return `github-${result.type || "parse"}`;
}

function downloadTextFile({ text, filename, mimeType }) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setOutputFormat(nextFormat) {
  outputFormat = nextFormat === "csv" ? "csv" : "json";
  formatJsonButton?.classList.toggle("is-active", outputFormat === "json");
  formatCsvButton?.classList.toggle("is-active", outputFormat === "csv");
  updateUi();
}

function updateUi() {
  const isSupported = Boolean(currentPageType);
  const hasResult = Boolean(lastResult);
  const format = getOutputFormat();

  parseButton.disabled = !isSupported;
  formatJsonButton.disabled = !isSupported;
  formatCsvButton.disabled = !isSupported;
  copyButton.disabled = !isSupported || !hasResult;
  downloadJsonButton.disabled = !isSupported || !hasResult;
  downloadCsvButton.disabled = !isSupported || !hasResult;

  copyButton.textContent = format === "csv" ? "Copy CSV" : "Copy JSON";
  setOutput(getOutputText(format));
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
    setStatus("Unsupported", "Supported pages are GitHub repository roots and personal profile roots only.");
    lastResult = null;
    updateUi();
    return;
  }

  setStatus(
    currentPageType === "repository" ? "Repository" : "User profile",
    "This page is supported. Run the local parser to generate structured JSON."
  );
  updateUi();
}

parseButton.addEventListener("click", async () => {
  if (!currentTab?.id || !currentPageType) {
    return;
  }

  parseButton.disabled = true;
  copyButton.disabled = true;
  downloadJsonButton.disabled = true;
  downloadCsvButton.disabled = true;
  setStatus("Parsing", "Reading the current page and running the parser locally.");
  setOutput("Parsing...");

  try {
    const { html, url } = await readActiveTabHtml(currentTab.id);
    const result = parseGitHubPage(currentPageType, html, url);
    lastResult = result;
    updateUi();

    if (result.success) {
      setStatus("Success", "Structured JSON generated for the current page.");
    } else {
      setStatus("Parser error", result.error || "Unable to parse this page.");
    }
  } catch (error) {
    lastResult = null;
    setStatus("Runtime error", error.message);
    setOutput(error.stack || error.message);
  } finally {
    updateUi();
  }
});

copyButton.addEventListener("click", async () => {
  if (!lastResult) {
    return;
  }

  const format = getOutputFormat();
  await navigator.clipboard.writeText(getOutputText(format));
  setStatus("Copied", format === "csv" ? "CSV copied to the clipboard." : "JSON copied to the clipboard.");
});

downloadJsonButton.addEventListener("click", () => {
  if (!lastResult) return;
  const base = getBaseFilename(lastResult);
  downloadTextFile({
    text: JSON.stringify(lastResult, null, 2),
    filename: `${base}.json`,
    mimeType: "application/json"
  });
  setStatus("Downloaded", "JSON saved to your downloads.");
});

downloadCsvButton.addEventListener("click", () => {
  if (!lastResult) return;
  const base = getBaseFilename(lastResult);
  downloadTextFile({
    text: toCsv(lastResult),
    filename: `${base}.csv`,
    mimeType: "text/csv"
  });
  setStatus("Downloaded", "CSV saved to your downloads.");
});

formatJsonButton.addEventListener("click", () => {
  setOutputFormat("json");
});

formatCsvButton.addEventListener("click", () => {
  setOutputFormat("csv");
});

refreshPageSupport();
