# GitHub Parser Notes

## Selector Strategy

- Prefer canonical and Open Graph metadata for URL, page identity, and descriptions.
- Use GitHub route metadata such as `route-controller`, `route-pattern`, and repository/profile meta tags to reject unsupported routes.
- Use semantic attributes where possible:
  - `itemprop="programmingLanguage"`
  - `itemprop="worksFor"`
  - `itemprop="homeLocation"`
  - `itemprop="url"`
- Use visible UI selectors only when metadata is not available, such as pinned repository cards and follower counts.

## Supported Pages

- Repository root pages only: `https://github.com/{owner}/{repo}`
- Personal profile root pages only: `https://github.com/{username}`

## Out of Scope For v1

- Organization profiles
- Repository subpages like `issues`, `pulls`, and `actions`
- Profile tab routes like `?tab=repositories`
- Authenticated-only data

## Blog Post Seed

The blog post for this project should explain:

- why repository roots and profile roots are the most stable SEO-friendly entry points
- how canonical URLs and GitHub metadata reduce selector brittleness
- which fields come from metadata versus visible DOM
- why the extension stays local while the OloStep API is the scale path
