# Chrome Web Store Listing

## Extension Name

Scrape GitHub by Olostep

## Short Description

Extract GitHub data as JSON or CSV, then discover Olostep's Web Data API for scalable scraping and AI workflows.

## Full Description

Scrape GitHub by Olostep is a lightweight Chrome extension that turns GitHub repository pages and personal user profiles into structured JSON or CSV directly from your browser.

Use it to quickly extract GitHub data such as repository names, descriptions, stars, forks, watchers, topics, programming languages, licenses, README summaries, profile bios, follower counts, social links, and pinned repositories.

This extension is designed as a simple example of structured web data extraction. For developers and teams that need to scrape websites at scale, crawl pages, extract clean Markdown, HTML, PDFs, or structured JSON, and power AI agents with reliable web data, Olostep provides a full Web Data API.

Olostep helps you search, extract, and structure web data from any website through developer-friendly APIs for scrapes, crawls, answers, parsers, batches, and browser automations.

Key features:

- Scrape GitHub repository pages into structured JSON
- Export GitHub data as CSV
- Parse GitHub user profiles and pinned repositories
- Copy or download extracted data from the browser
- Run local parsing from the active GitHub tab
- Discover Olostep for scalable web scraping, crawling, and AI data workflows

Scrape GitHub is useful for open-source research, developer sourcing, repository analysis, technical research, competitive intelligence, and structured GitHub data collection.

Supported pages currently include GitHub repository root pages and personal user profile root pages.

When you are ready to move beyond a browser extension, visit https://olostep.com to build scalable web data pipelines with Olostep's Web Data API for AI.

## Single Purpose Statement

Scrape GitHub by Olostep extracts structured JSON or CSV from the active supported GitHub repository or personal profile page when the user clicks the extension popup.

## Category

Developer Tools

## Language

English

## Website URL

https://olostep.com

## Support URL

https://olostep.com

## Privacy Policy URL

https://www.olostep.com/privacy-policy

## Permission Justifications

### activeTab

Required so the extension can access the currently active tab only after the user opens the extension and requests parsing. The extension uses this access to read the supported GitHub page the user wants to parse.

### scripting

Required to run a small script in the active tab that reads the page URL and HTML. This lets the extension parse the current GitHub repository or profile page locally in the popup.

### Host permission: https://github.com/*

Required to limit extension parsing to GitHub pages. The extension supports GitHub repository root pages and personal user profile root pages.

## Privacy Practices Answers

### Does the extension collect user data?

No. The extension reads the active GitHub page HTML and URL locally only when the user clicks "Parse current page". It does not store, transmit, sell, or share parsed data.

### Does the extension use remote code?

No. All extension code is included in the extension package.

### Does the extension use analytics or tracking?

No. The extension does not include analytics, advertising SDKs, telemetry, tracking pixels, or behavioral tracking.

### Does the extension transfer data to Olostep or third parties?

No. Parsed GitHub page content, JSON, CSV, and URLs are not sent to Olostep or third parties. The popup includes a link to Olostep's website, and clicking it navigates the browser to https://olostep.com.

## Store Assets

Prepared assets:

- `store-assets/screenshot-1280x800.png`
- `store-assets/small-promo-440x280.png`
- `extension/icons/icon-128.png`

## Manual QA Checklist

- Load the `extension/` folder as an unpacked extension in Chrome.
- Open a GitHub repository root page and confirm parsing succeeds.
- Open a GitHub personal profile root page and confirm parsing succeeds.
- Open an unsupported GitHub subpage and confirm parsing is disabled.
- Open a non-GitHub page and confirm parsing is disabled.
- Copy JSON and CSV results.
- Download JSON and CSV results.
- Click the Olostep links and confirm they open https://olostep.com.

## Upload Notes

Upload `dist/scrape-github-by-olostep.zip` to the Chrome Web Store dashboard.
