# warrimoo.net — backlog

Working list for the website. Items move to "Done" with the commit that shipped them.
(Note: this repo is served verbatim, so this file is public — keep it to product work.)

## When the apps launch

- [ ] TreatMyPet2 hits Google Play: swap the "Coming soon" Play badge for the real listing link (homepage + app page), change status lines from "In development · coming 2026" to live, and refresh screenshots from the release build.
- [ ] Same again for Treat the Babs when it lands.
- [ ] iOS builds ship (post-Mac): update "Android first, iPhone to follow" wording and light up the App Store badges.
- [ ] Before household/family sharing, safety alerts or the newsletter go live in-app: expand privacy policy section 5 with the full shipped details (the policy promises this), bump the effective date, and revisit the "we cannot see your pets' records" at-a-glance claim for synced households.
- [ ] When a third app goes public, add its page, showcase block, nav/footer links, sitemap entry, and bump the "2 apps on the workbench" story stats.

## Content and polish

- [ ] Social share images: no og:image anywhere yet — a branded card per app page plus a default would make shared links look proper.
- [ ] apple-touch-icon + PNG favicon fallbacks (currently SVG-only favicon).
- [ ] Consider self-hosting the two Google Fonts: removes the last third-party request, aligns fully with the "no tracking" promise, simplifies the CSP, and drops the fonts disclosure from the privacy policy.
- [ ] Port Macquarie story tile: current photo is in; revisit crop/quality if a better shot turns up.

## Performance and platform

- [ ] Confirm the mobile scroll-shudder fix on a real device (commit a8bdb4c). If any remains, next lever: gate the hero parallax under 900px.
- [ ] If the securityheaders.com letter grade ever matters commercially: front the site with Cloudflare (free) to send real headers (HSTS with includeSubDomains would cover the blog too). Meta-CSP already covers the substance.
- [ ] Light accessibility pass: keyboard focus audit, prefers-contrast spot-check. (Decorative fish/whale/gull interactions are pointer-only Easter eggs by design.)

## Decided, for the record

- Scanner stays off the public site (internal tool, no store listing).
- The illustrated beach stays as the hero art; only the story tile uses a photo.
- securityheaders F grade accepted on GitHub Pages (headers impossible; meta tags carry the policy).
