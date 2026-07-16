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
  /* four reef species: clownfish, tang, banded lagoonfish, sunny angel */
  var FISH_SPECIES = [
    '<svg viewBox="0 0 64 34" aria-hidden="true">' +
      '<path class="fish__tail" d="M45 17 L61 7 Q56 17 61 27 Z" fill="#E85643"/>' +
      '<ellipse cx="26" cy="17" rx="20" ry="11" fill="#FF8A5C"/>' +
      '<path d="M19 8 Q26 2 32 7.5 L26 11 Z" fill="#E85643"/>' +
      '<path d="M16 7.7 Q21 17 16 26.3 Q11 17 16 7.7 Z" fill="#FFF9EE"/>' +
      '<path d="M30 6.4 Q35 17 30 27.6 Q25 17 30 6.4 Z" fill="#FFF9EE"/>' +
      '<circle cx="11" cy="13.5" r="2.5" fill="#16384C"/>' +
      '<circle cx="11.9" cy="12.6" r="0.8" fill="#FFFFFF"/>' +
      "</svg>",
    '<svg viewBox="0 0 64 34" aria-hidden="true">' +
      '<path class="fish__tail" d="M45 17 L61 7 Q56 17 61 27 Z" fill="#FFC247"/>' +
      '<ellipse cx="26" cy="17" rx="20" ry="11" fill="#0E7FA8"/>' +
      '<path d="M10 13.5 Q26 3.5 42 13.5 Q26 9 10 13.5 Z" fill="#16384C" opacity="0.6"/>' +
      '<path d="M19 8 Q26 2 32 7.5 L26 11 Z" fill="#0C7B74"/>' +
      '<circle cx="11" cy="13.5" r="2.4" fill="#FFFBF1"/>' +
      '<circle cx="11.4" cy="13.8" r="1.2" fill="#16384C"/>' +
      "</svg>",
    '<svg viewBox="0 0 64 34" aria-hidden="true">' +
      '<path class="fish__tail" d="M45 17 L61 7 Q56 17 61 27 Z" fill="#FF6F5E"/>' +
      '<ellipse cx="26" cy="17" rx="20" ry="11" fill="#13A89E"/>' +
      '<path d="M14 8.4 Q17 17 14 25.6 Q11 17 14 8.4 Z" fill="#FFF9EE" opacity="0.85"/>' +
      '<path d="M24 6.2 Q27 17 24 27.8 Q21 17 24 6.2 Z" fill="#FFF9EE" opacity="0.85"/>' +
      '<path d="M34 7.2 Q37 17 34 26.8 Q31 17 34 7.2 Z" fill="#FFF9EE" opacity="0.85"/>' +
      '<path d="M19 8 Q26 2 32 7.5 L26 11 Z" fill="#0C7B74"/>' +
      '<circle cx="10.5" cy="13.5" r="2.3" fill="#16384C"/>' +
      "</svg>",
    '<svg viewBox="0 0 64 34" aria-hidden="true">' +
      '<path class="fish__tail" d="M45 17 L61 7 Q56 17 61 27 Z" fill="#F5A623"/>' +
      '<ellipse cx="26" cy="17" rx="20" ry="11" fill="#FFC247"/>' +
      '<path d="M19 8 Q26 2 32 7.5 L26 11 Z" fill="#FF6F5E"/>' +
      '<path d="M22 26.5 Q29 31.5 36 25.5 L28 23.5 Z" fill="#FF6F5E"/>' +
      '<path d="M26 12 Q32 17 26 22 Q22 17 26 12 Z" fill="#F5A623" opacity="0.8"/>' +
      '<circle cx="11" cy="13.5" r="2.4" fill="#16384C"/>' +
      "</svg>"
  ];

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
        f.style.opacity = (pale ? 0.26 + Math.random() * 0.16 : 0.32 + Math.random() * 0.2).toFixed(2);
        if (Math.random() < 0.5) {
          f.classList.add("fish--flip"); // face right, swim left to right
        } else {
          f.style.animationDirection = "reverse"; // face left, swim right to left
        }
        // dart wrapper: startle/current offsets live here so they never
        // fight the crossing (on .fish) or the bob (on the svg)
        f.innerHTML = '<span class="fish__dart">' + FISH_SPECIES[(Math.random() * FISH_SPECIES.length) | 0] + "</span>";
        layer.appendChild(f);
      }
      section.prepend(layer);
    });
  }

  /* ---------- Fish react to the pointer and to scroll ---------- */
  var fishLayers = document.querySelectorAll(".fish-layer");
  var fishEls = document.querySelectorAll(".fish");

  function startleFish(fish, px, py, power) {
    var r = fish.getBoundingClientRect();
    if (!r.width) return; // hidden by the mobile shoal cap
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var dx = cx - px, dy = cy - py;
    var dist = Math.hypot(dx, dy);
    var radius = power > 1 ? 150 : 95;
    if (dist > radius) return;
    var proximity = (radius - dist) / radius;
    var mag = (30 + 70 * proximity) * power;
    var nx = dist ? dx / dist : Math.random() - 0.5;
    var ny = dist ? dy / dist : -0.6;
    var dart = fish.firstElementChild;
    if (!dart) return;
    dart.style.setProperty("--dx", (nx * mag).toFixed(0) + "px");
    dart.style.setProperty("--dy", (ny * mag * 0.7).toFixed(0) + "px");
    fish.classList.add("is-startled");
    clearTimeout(fish._calmT);
    fish._calmT = setTimeout(function () {
      dart.style.setProperty("--dx", "0px");
      dart.style.setProperty("--dy", "0px");
      fish.classList.remove("is-startled");
    }, 620);
  }

  if (fishEls.length && !reduceMotion) {
    var pmPending = false;
    document.addEventListener("pointermove", function (e) {
      if (pmPending) return;
      pmPending = true;
      var px = e.clientX, py = e.clientY;
      window.requestAnimationFrame(function () {
        pmPending = false;
        for (var i = 0; i < fishEls.length; i++) startleFish(fishEls[i], px, py, 1);
      });
    }, { passive: true });

    document.addEventListener("pointerdown", function (e) {
      for (var i = 0; i < fishEls.length; i++) startleFish(fishEls[i], e.clientX, e.clientY, 1.7);
    }, { passive: true });
  }

  /* scroll current: the shoal lags behind fast scrolling, then settles */
  var lastDriftY = window.scrollY;
  var driftIdleT;
  function updateFishDrift() {
    if (!fishLayers.length || reduceMotion) return;
    var y = window.scrollY;
    var v = y - lastDriftY;
    lastDriftY = y;
    var drift = Math.max(-30, Math.min(30, v * 0.5));
    for (var i = 0; i < fishLayers.length; i++) {
      fishLayers[i].style.setProperty("--drift", drift.toFixed(1) + "px");
    }
    clearTimeout(driftIdleT);
    driftIdleT = setTimeout(function () {
      for (var j = 0; j < fishLayers.length; j++) {
        fishLayers[j].style.setProperty("--drift", "0px");
      }
    }, 160);
  }
  window.addEventListener("scroll", updateFishDrift, { passive: true });

  /* ---------- Clickable whale: tap mid-breach for a bigger jump ---------- */
  var whaleEl = document.querySelector(".hero__whale .whale");
  var whaleSplash = document.querySelector(".whale-splash");
  if (whaleEl && whaleSplash && !reduceMotion) {
    whaleEl.addEventListener("pointerdown", function () {
      if (whaleEl.classList.contains("is-boosted")) return;
      if (parseFloat(getComputedStyle(whaleEl).opacity) < 0.05) return; // under water
      whaleEl.classList.add("is-boosted");
      whaleSplash.classList.add("is-boosted");
      whaleEl.addEventListener("animationend", function onEnd(e) {
        if (e.animationName !== "whale-breach-high") return;
        whaleEl.removeEventListener("animationend", onEnd);
        whaleEl.classList.remove("is-boosted");
        whaleSplash.classList.remove("is-boosted");
        // restart the normal loop from the top so whale, splash and
        // droplets all come back in step
        whaleEl.style.animation = "none";
        whaleSplash.style.animation = "none";
        void whaleEl.offsetWidth;
        whaleEl.style.animation = "";
        whaleSplash.style.animation = "";
      });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
