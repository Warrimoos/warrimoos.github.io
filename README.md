# Warrimoo (warrimoo.net)

Static marketing site for the Warrimoo indie app studio (pet-care apps), designed for **GitHub Pages**. No build step: plain HTML, CSS and vanilla JS.

## Structure

```
index.html              Landing page (parallax beach hero, app showcase)
apps/treatmypet.html    TreatMyPet app page; use as the template for future apps
privacy.html            Privacy policy (covers site + offline-first apps)
terms.html              Terms of use (incl. veterinary disclaimer)
404.html                Custom not-found page (GitHub Pages picks this up automatically)
assets/css/style.css    Design system + all components
assets/js/main.js       Parallax, scroll reveals, nav, carousel, paw button
assets/img/             SVG artwork (hero placeholder, favicon, app screens)
robots.txt, sitemap.xml SEO basics (point at warrimoo.net)
.nojekyll               Tells GitHub Pages to skip Jekyll processing
```

## Deploy to GitHub Pages

1. Create a repo (e.g. `warrimoo-site`), commit everything in this folder, push.
2. Repo **Settings → Pages → Source**: deploy from branch `main`, folder `/ (root)`.
3. **Custom domain**: enter `warrimoo.net`, then add the DNS records GitHub shows you
   (apex `A` records + `www` CNAME). GitHub writes a `CNAME` file to the repo for you.
   Tick **Enforce HTTPS** once the certificate is issued.

> Without a custom domain the site lives at `https://<user>.github.io/<repo>/`.
> Everything works there except `404.html` and `robots.txt`/`sitemap.xml`, which assume
> the site is served from the domain root. They'll be correct as soon as
> `warrimoo.net` is connected.

## Swapping in the real beach photo

The hero currently uses a hand-drawn SVG beach. When the photo is ready:

1. Drop it in as `assets/img/hero-beach.jpg` (recommended ≥1920px wide, compressed,
   ideally also a WebP).
2. In `assets/css/style.css`, change the first token:

   ```css
   --hero-image: url("../img/hero-beach.jpg");
   ```

That's it: the scrim, parallax, birds and foam wave all sit on top of whatever photo
you use, and the scrim keeps the headline readable regardless of the photo's brightness.
The same SVG is reused in the "Our story" section (`index.html`); swap that `<img>`
too if you want the photo there.

## Replacing the mock app screens with real screenshots

The five frames on `apps/treatmypet.html` point at hand-drawn SVG previews in
`assets/img/treatmypet/`. Replace each `src` with a real screenshot (PNG/WebP,
~390×844 or any same-ratio size) and update the `alt` text. Keep `loading="lazy"`
on all but the first.

## Adding a new app page

1. Copy `apps/treatmypet.html` → `apps/<newapp>.html`.
2. Update: `<title>`, meta description, canonical/OG URLs, app name, status,
   copy, feature cards, screenshots folder (`assets/img/<newapp>/`), and the
   store badges (swap the "Soon" spans for real `<a>` store links at launch).
3. Add the app to: `index.html` apps section, both page footers, and `sitemap.xml`.
4. If the app's privacy story differs from the standard offline-first promise,
   add a subsection to `privacy.html` (section 5 is the per-app pattern).

## Going live checklist

- [ ] Read `privacy.html` and `terms.html` end-to-end and confirm every claim is true
      for the app you're shipping (no analytics, offline-only, contact email, etc.).
- [ ] The public contact address is `support@warrimoo.net`; make sure that mailbox exists before launch.
- [ ] When TreatMyPet ships: swap "coming soon" badges for real store links and
      update the app status lines.
- [ ] App store listings: use `https://warrimoo.net/privacy.html` as the privacy
      policy URL and `https://warrimoo.net/apps/treatmypet.html#support` as support URL.

## Local preview

Any static server works, e.g.:

```powershell
python -m http.server 8080   # then open http://localhost:8080
```
