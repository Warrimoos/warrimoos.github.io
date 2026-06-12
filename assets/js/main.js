/* Warrimoo interactions: parallax, bubbles, reveals, nav, paw FAB, carousel */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.querySelector(".site-header");

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  function setNav(open) {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-locked", open);
    if (open) {
      var first = mobileNav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      navToggle.focus({ preventScroll: true });
    }
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) setNav(false);
    });
  }

  /* ---------- Hero parallax + scroll bubbles (rAF, transform-only) ---------- */
  var hero = document.querySelector(".hero");
  var parallaxEls = (reduceMotion || !hero) ? [] : Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var heroContent = hero ? hero.querySelector(".hero__content") : null;
  var ticking = false;

  /* a handful of bubbles; the field wakes on first scroll, then each bubble
     rises on its own independent loop (negative delays = already mid-flight) */
  var BUBBLES = [
    { left: 7,  size: 11, dur: 8,    delay: -2,   rise: 300 },
    { left: 16, size: 18, dur: 11,   delay: -7,   rise: 420 },
    { left: 27, size: 9,  dur: 6.5,  delay: 0.6,  rise: 260 },
    { left: 41, size: 14, dur: 9.5,  delay: -4,   rise: 380 },
    { left: 55, size: 10, dur: 7,    delay: -1.2, rise: 320 },
    { left: 66, size: 20, dur: 13,   delay: -9,   rise: 440 },
    { left: 78, size: 12, dur: 8.5,  delay: 1.4,  rise: 300 },
    { left: 88, size: 15, dur: 10.5, delay: -5.5, rise: 400 },
    { left: 95, size: 8,  dur: 6,    delay: -3,   rise: 250 }
  ];
  var bubbleWrap = null;
  var bubblesActive = false;
  if (hero && !reduceMotion) {
    bubbleWrap = document.createElement("div");
    bubbleWrap.className = "hero__bubbles";
    bubbleWrap.setAttribute("aria-hidden", "true");
    BUBBLES.forEach(function (b) {
      var span = document.createElement("span");
      span.className = "bubble";
      span.style.left = b.left + "%";
      span.style.setProperty("--s", b.size + "px");
      span.style.setProperty("--rise", b.rise + "px");
      span.style.animationDuration = b.dur + "s";
      span.style.animationDelay = b.delay + "s";
      span.appendChild(document.createElement("i"));
      bubbleWrap.appendChild(span);
    });
    var scrim = hero.querySelector(".hero__scrim");
    if (scrim) scrim.after(bubbleWrap); else hero.appendChild(bubbleWrap);
  }

  /* ---------- Interactive gulls: tap one, it splashes down, then recovers ---------- */
  var birdLayer = hero ? hero.querySelector(".hero__birds") : null;
  if (birdLayer && !reduceMotion) {
    var WATERLINE = 0.66; // sea level as a fraction of hero height
    var FALL_MS = 650, UNDER_MS = 2000, RISE_MS = 700;

    Array.prototype.forEach.call(birdLayer.querySelectorAll("svg"), function (bird) {
      bird.addEventListener("pointerdown", function () {
        if (bird.dataset.state) return; // already in the drink
        var cs = getComputedStyle(bird);
        if (!bird.dataset.origDelay) {
          // stash the stylesheet timings before inline overrides pollute them
          bird.dataset.origDelay = cs.animationDelay;
          bird.dataset.origDur = cs.animationDuration;
        }
        var heroRect = hero.getBoundingClientRect();
        var rect = bird.getBoundingClientRect();
        var leftPx = parseFloat(cs.left) || 0;

        bird.dataset.state = "falling";
        bird.style.left = leftPx + "px"; // freeze the crossing mid-air
        bird.style.animationDelay = "0s"; // the dive starts from frame 0
        var fallDist = Math.max(heroRect.height * WATERLINE - (rect.top - heroRect.top), 60);
        bird.style.setProperty("--fall-dist", fallDist.toFixed(0) + "px");
        bird.classList.add("is-falling");

        setTimeout(function () { // splash on impact
          var splash = document.createElement("div");
          splash.className = "bird-splash";
          splash.setAttribute("aria-hidden", "true");
          splash.style.left = (leftPx + rect.width / 2) + "px";
          splash.style.top = (heroRect.height * WATERLINE) + "px";
          birdLayer.appendChild(splash);
          setTimeout(function () { splash.remove(); }, 700);
        }, FALL_MS - 80);

        setTimeout(function () { // two seconds under, then climb back out
          bird.dataset.state = "rising";
          bird.classList.remove("is-falling");
          bird.classList.add("is-rising");
          setTimeout(function () {
            // re-phase the crossing so it resumes from where it fell
            // (bird-cross runs left: -8% -> 105%, i.e. 113 points of travel)
            var progress = ((leftPx / heroRect.width) * 100 + 8) / 113;
            progress = Math.min(Math.max(progress, 0), 0.99);
            var crossDur = parseFloat(bird.dataset.origDur) || 36;
            var delays = bird.dataset.origDelay.split(",");
            delays[0] = (-progress * crossDur).toFixed(2) + "s";
            bird.style.animationDelay = delays.join(",");
            bird.classList.remove("is-rising");
            bird.style.left = "";
            delete bird.dataset.state;
          }, RISE_MS);
        }, FALL_MS + UNDER_MS);
      });
    });
  }

  function applyParallax() {
    ticking = false;
    if (!hero) return;
    var y = window.scrollY;
    var heroH = hero.offsetHeight;
    if (y > heroH + 200) return; // hero off-screen, skip work

    for (var i = 0; i < parallaxEls.length; i++) {
      var depth = parseFloat(parallaxEls[i].getAttribute("data-depth")) || 0;
      parallaxEls[i].style.transform = "translate3d(0," + (y * depth).toFixed(1) + "px,0)";
    }

    // headline lingers and fades while the page scrolls past it
    if (heroContent && !reduceMotion) {
      heroContent.style.transform = "translate3d(0," + (y * 0.34).toFixed(1) + "px,0)";
      heroContent.style.opacity = Math.max(0, 1 - y / (heroH * 0.72)).toFixed(3);
    }
  }

  /* ---------- Paw FAB: scroll progress + back to top ---------- */
  var fab = document.querySelector(".paw-fab");
  var fabRing = fab ? fab.querySelector(".ring circle") : null;
  var RING_LEN = 163.4;

  function updateFab() {
    if (!fab) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    fab.classList.toggle("is-show", window.scrollY > 480);
    if (fabRing) fabRing.style.strokeDashoffset = (RING_LEN * (1 - progress)).toFixed(1);
  }

  if (fab) {
    fab.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Single scroll loop ---------- */
  var heroAnimated = hero && !reduceMotion;

  function onScroll() {
    updateHeader();
    updateFab();
    if (bubbleWrap && !bubblesActive && window.scrollY > 40) {
      bubblesActive = true;
      bubbleWrap.classList.add("is-active");
    }
    if (!ticking && heroAnimated) {
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  // Auto-stagger: children of [data-reveal-group] get incremental delays.
  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    var step = parseFloat(group.getAttribute("data-reveal-group")) || 0.09;
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
      child.style.setProperty("--d", (i * step).toFixed(2) + "s");
    });
  });

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Screenshot carousel ---------- */
  document.querySelectorAll(".shots-wrap").forEach(function (wrap) {
    var track = wrap.querySelector(".shots");
    if (!track) return;
    wrap.querySelectorAll("[data-shots-prev], [data-shots-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = track.querySelector("figure");
        var dist = card ? card.getBoundingClientRect().width + 24 : 300;
        track.scrollBy({
          left: btn.hasAttribute("data-shots-prev") ? -dist : dist,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    });
  });

  /* ---------- Under-water fish: drift behind content in [data-fish] sections ---------- */
  var FISH_COLORS = ["#13A89E", "#0E7FA8", "#FF6F5E", "#F5A623", "#3E647C"];

  function fishSvg() {
    return '<svg viewBox="0 0 64 34" aria-hidden="true">' +
      '<path class="fish__tail" d="M45 17 L61 7 Q56 17 61 27 Z" fill="currentColor"/>' +
      '<ellipse cx="26" cy="17" rx="20" ry="11" fill="currentColor"/>' +
      '<path d="M19 8 Q26 2 32 7.5 L26 11 Z" fill="currentColor"/>' +
      '<circle cx="13" cy="13.5" r="2.3" fill="#FFFBF1" opacity="0.9"/>' +
      "</svg>";
  }

  if (!reduceMotion) {
    document.querySelectorAll("[data-fish]").forEach(function (section) {
      var count = parseInt(section.getAttribute("data-fish"), 10) || 5;
      var pale = section.hasAttribute("data-fish-dark"); // ink band: cream fish
      var layer = document.createElement("div");
      layer.className = "fish-layer";
      layer.setAttribute("aria-hidden", "true");
      for (var i = 0; i < count; i++) {
        var f = document.createElement("span");
        f.className = "fish";
        var dur = 26 + Math.random() * 30; // 26 - 56s per crossing
        f.style.setProperty("--fs", (26 + Math.random() * 80).toFixed(0) + "px");
        f.style.setProperty("--bob", (3 + Math.random() * 3).toFixed(1) + "s");
        f.style.top = (5 + Math.random() * 85).toFixed(1) + "%";
        f.style.animationDuration = dur.toFixed(1) + "s";
        f.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s"; // mid-crossing
        f.style.opacity = (pale ? 0.1 + Math.random() * 0.08 : 0.12 + Math.random() * 0.14).toFixed(2);
        f.style.color = pale ? "#FFF9EE" : FISH_COLORS[(Math.random() * FISH_COLORS.length) | 0];
        if (Math.random() < 0.5) {
          f.classList.add("fish--flip"); // face right, swim left to right
        } else {
          f.style.animationDirection = "reverse"; // face left, swim right to left
        }
        f.innerHTML = fishSvg();
        layer.appendChild(f);
      }
      section.prepend(layer);
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
