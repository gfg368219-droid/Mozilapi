---
name: MozAnim product direction
description: Persistent visual and navigation requirements for the MozAnim app.
---

- Keep the interface near-black with blue/cyan accents inspired by the reference site's visual direction, without showing upstream branding on cards, details, or readers.
- Keep API documentation public and omit the Help section from navigation.
- Keep planning information concise; do not add redundant “updated” labels or repeated explanatory schedule text.
- Auto-initialize the external PostgreSQL schema from `DATABASE_URL`, but do not insert episodes or chapters into SQL tables; episode listings stay source-driven.
- Use rotating anime cover art in the homepage hero; do not replace it with a static promotional banner.

**Why:** The user explicitly requested this visual/navigation direction, clarified that automatic database setup creates tables only, and corrected the static hero banner in favor of rotating anime artwork.

**How to apply:** Follow these rules when changing the catalogue, planning, reader, authentication, database startup, or API documentation UI. The planning is expected to reflect schedule changes; clarify whether the user means live source updates or manual editing when it is ambiguous.
