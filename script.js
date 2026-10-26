
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const loader = $("#loader");
  const navbar = $("#navbar");
  const cursorGlow = $("#cursorGlow");
  const starField = $("#starField");
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  const toast = $("#toast");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Loading screen
  const finishLoading = () => {
    loader?.classList.add("done");
    document.body.classList.add("loaded");
  };

  window.addEventListener("load", finishLoading, { once: true });
  window.setTimeout(finishLoading, 1800);

  // Procedurally generated stars: CSS only, no 3D libraries.
  if (starField) {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 95; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      star.style.animationDuration = `${2 + Math.random() * 4}s`;

      if (i % 5 === 0) {
        star.style.width = "3px";
        star.style.height = "3px";
      }

      fragment.appendChild(star);
    }

    starField.appendChild(fragment);
  }

  // Navigation: scroll state and mobile menu.
  const updateNavigation = () => {
    navbar?.classList.toggle("scrolled", window.scrollY > 35);
  };

  updateNavigation();
  window.addEventListener("scroll", updateNavigation, { passive: true });

  function closeMenu() {
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
    navLinks?.classList.remove("open");
    document.body.classList.remove("menu-open");
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );

    navLinks?.classList.toggle("open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
  });

  $$("#navLinks a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) closeMenu();
  });

  // Reveal elements as they enter the viewport.
  const revealElements = $$(".reveal");

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -25px 0px" }
    );

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("visible"));
  }

  // Multi-layer scroll parallax.
  // Each element moves at a different rate for a sense of depth.
  const parallaxElements = $$(".parallax");
  let scrollQueued = false;

  function updateParallax() {
    if (reducedMotion) return;

    const scrollY = window.scrollY;

    parallaxElements.forEach((element) => {
      const speed = Number(element.dataset.speed) || 0;
      const rect = element.getBoundingClientRect();

      if (rect.bottom < -150 || rect.top > window.innerHeight + 150) {
        return;
      }

      element.style.transform =
        `translate3d(0, ${scrollY * speed}px, 0)`;
    });

    scrollQueued = false;
  }

  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });

  updateParallax();

  // Mouse-driven light follows the pointer on desktop.
  if (cursorGlow && !reducedMotion &&
      window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
  }

  // Subtle 3D-like card tilt using CSS transforms only.
  // Disabled for touch devices and reduced-motion preferences.
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    $$(".frontier-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 3;
        const rotateX = (0.5 - y) * 3;

        card.style.transform =
          `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  // Filter the frontier cards.
  const filterButtons = $$(".filter-chip");
  const frontierCards = $$(".frontier-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      frontierCards.forEach((card) => {
        const matches =
          filter === "all" || card.dataset.category === filter;

        card.classList.toggle("is-hidden", !matches);
      });
    });

    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("active"))
    );
  });

  // Accessible FAQ accordion. Only one answer stays open at a time.
  $$(".faq-item").forEach((item) => {
    const button = $(".faq-question", item);
    const icon = $("span", button);

    button?.addEventListener("click", () => {
      const shouldOpen = !item.classList.contains("open");

      $$(".faq-item").forEach((other) => {
        other.classList.remove("open");
        $(".faq-question", other)?.setAttribute("aria-expanded", "false");

        const otherIcon = $(".faq-question span", other);
        if (otherIcon) otherIcon.textContent = "+";
      });

      if (shouldOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
        if (icon) icon.textContent = "−";
      }
    });
  });

  // Subtle motion on the large festival CTA.
  const registerSection = $(".register-section");
  const registerContent = $(".register-content");

  if (registerSection && registerContent && !reducedMotion &&
      window.matchMedia("(pointer: fine)").matches) {
    registerSection.addEventListener("pointermove", (event) => {
      const rect = registerSection.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      registerContent.style.transform =
        `translate3d(${x * 7}px, ${y * 5}px, 0)`;
    });

    registerSection.addEventListener("pointerleave", () => {
      registerContent.style.transform = "";
    });
  }

  // Friendly feedback for local in-page navigation.
  // No fake registrations or fabricated submission confirmations.
  let toastTimer;

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  // Optional browser feedback for copyable page attribution.
  // Nothing is sent to a server.
  const credit = $(".credit");

  credit?.addEventListener("click", () => {
    showToast("Concept website by Nihar Tiwari.");
  });

  // Keep parallax and hover effects from competing with accessibility settings.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cursorGlow?.style.setProperty("opacity", "0");
    } else {
      cursorGlow?.style.setProperty("opacity", "1");
    }
  });
});
