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

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
