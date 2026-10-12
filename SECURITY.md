# Security and privacy — Stelios Sioulas

The site remains a static GitHub Pages website. Each deployed HTML document includes an early meta CSP and a referrer policy. Google ownership verification remains unchanged.

## Updating HTML

After changing executable inline scripts, regenerate and verify the policy before publication:

```sh
node scripts/security-policy.mjs
node scripts/security-policy.mjs --check
node --test scripts/security.test.mjs
```

The policy permits local scripts and the reviewed Cloudflare beacon, hashed existing inline scripts, Google Fonts, the configured form endpoint and only the reviewed frame origins where needed. Inline event handlers, arbitrary remote scripts, plugins, workers and base URL changes are blocked. Existing inline styles remain supported to preserve the design. GitHub Pages cannot apply custom HTTP security headers through a repository `_headers` file; meta CSP does not support `frame-ancestors`, HSTS or Permissions-Policy. These require a supporting hosting/edge configuration.

## Analytics

`security.config.json` records the public beacon identifier and HTTPS production hosts. `assets/js/web-analytics.js` loads only on those hosts and prevents duplicate beacons. Local/preview hosts do not report statistics. This token is not an account credential. Visitor information is linked from the footer in both languages. Google Fonts remains an external connection; do not describe every site request as cookie-free.

## Browser validation

The GitHub workflow tests all HTML pages at 320, 390, 768 and 1280 pixels under their actual meta CSP. PRs compare the existing typography, section dimensions and overflow with the base branch. Provider players and Formspree requests are intercepted; no real message or private data is submitted. Screenshots and a summary are attached to the workflow run.

## Video activation

Desktop and mobile fallback HTML contains local placeholders, not live provider frames. Pages CMS media rendering creates the same placeholders. Each selection loads only its chosen player; closing removes that frame and returns focus to its load button. No consent flag is saved. YouTube uses youtube-nocookie.com and an origin-only referrer. Player URLs are validated against exact provider hosts and supported path formats. No provider thumbnails or scripts load before selection. Font and analytics requests are independent of media activation.

The Press Kit print button uses a local event listener instead of a CSP-blocked inline handler. New media scripts use a versioned URL so previously cached CMS code cannot recreate automatic players after deployment.
