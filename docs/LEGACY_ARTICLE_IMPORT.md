# CPACE article archive import

Source: https://cpaceph.com/insights-news-updates/ and its public WordPress posts API.

The October 28, 2026 import contains all 44 published source posts. Twenty replace
shortened entries while preserving their existing IDs and `/insights/` URLs;
24 are new. Two existing entries without a matching source post are retained,
for 46 articles total. Source URLs, source IDs and original categories are recorded
in `data/articles.json`.

Original article text, publication dates, headings and links are retained. Images
are downloaded to `public/assets/articles/legacy/` and optimized as WebP. Elementor
layout, embedded scripts and duplicate featured images are removed. Links to
imported articles point to their new local URLs. Malformed legacy links retain
their text without a broken URL. Historical comments are not imported.

The article API merges the archive with managed database articles without writing
on a public GET request. An original placeholder is replaced only when all its
editable fields match the recorded fingerprint; staff edits take precedence.
Administrators can persist the archive using **Sync Landing Articles**. That
existing action replaces matching database content with the bundled archive.

To refresh the source snapshot and missing images:

```powershell
node --import tsx scripts/import-legacy-articles.mjs
```

Review the resulting data and image changes before deployment. The importer does
not change the database. Both data and images must be deployed together.
