---
name: Portable npm lockfiles
description: Keep npm dependency URLs usable by external build providers.
---

Lockfiles committed for external build services must not contain Replit Package Firewall tarball URLs. Use the canonical HTTPS npm registry URLs while preserving pinned versions and integrity hashes.

**Why:** Vercel cannot resolve `package-firewall.replit.internal` or `.local`, so npm install fails before the build starts.

**How to apply:** Before finishing a dependency installation for an external build target, inspect every `resolved` URL in `package-lock.json`. Normalize any internal firewall URL to the matching `https://registry.npmjs.org/` tarball path.
