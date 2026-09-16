# Repository presentation assets

- `repository-cover.jpg`: original Bjorvand AI cover artwork generated for this
  project, sized to 1280 × 640 pixels and compressed below 1 MB. It is used in the
  README and is the intended GitHub social-preview upload. It contains no provider
  logos or customer data. Included under the repository's MIT license.
- `report-preview.svg`: illustration generated from `fixtures/expected/report.json`
  by `npm run docs:assets`. It is a data preview, not a screenshot of a live Xero
  organization. `npm run docs:check` detects drift from the checked-in fixture.

GitHub's [social-preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)
requires uploading the image under repository Settings → Social preview;
committing the image alone does not change link cards.
