(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMobile.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // Safety net: some browser/tab states (e.g. background or prerendered tabs)
    // never fire IntersectionObserver callbacks. Don't let content stay hidden.
    window.addEventListener("load", () => {
      setTimeout(() => {
        document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("is-visible");
          }
        });
      }, 1200);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- mascot: avatar tilts and its badge points toward the cursor ---------- */
  const mascotFrame = document.getElementById("mascotFrame");
  const pointer = document.getElementById("mascotPointer");
  if (mascotFrame && pointer && !isTouch) {
    let targetAngle = 0;
    let currentAngle = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const updateTarget = (clientX, clientY) => {
      const rect = pointer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetAngle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;

      const frameRect = mascotFrame.getBoundingClientRect();
      const fcx = frameRect.left + frameRect.width / 2;
      const fcy = frameRect.top + frameRect.height / 2;
      targetTiltX = clamp((clientX - fcx) / 60, -8, 8);
      targetTiltY = clamp((clientY - fcy) / 60, -8, 8);
    };

    window.addEventListener("mousemove", (e) => updateTarget(e.clientX, e.clientY), { passive: true });

    const animate = () => {
      let delta = targetAngle - currentAngle;
      delta = ((delta + 180) % 360 + 360) % 360 - 180;
      currentAngle += delta * 0.08;
      pointer.style.transform = `rotate(${currentAngle}deg)`;

      currentTiltX += (targetTiltX - currentTiltX) * 0.06;
      currentTiltY += (targetTiltY - currentTiltY) * 0.06;
      mascotFrame.style.transform = `translate(64px, -56px) translate(${currentTiltX}px, ${currentTiltY}px) rotate(${currentTiltX * 0.6}deg)`;

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /* ---------- cursor trail (canvas particles) ---------- */
  const canvas = document.getElementById("trail-canvas");
  if (canvas && !isTouch && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastSpawn = 0;
    window.addEventListener(
      "mousemove",
      (e) => {
        const now = performance.now();
        if (now - lastSpawn < 16) return;
        lastSpawn = now;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          r: 5 + Math.random() * 3,
          life: 1,
        });
        if (particles.length > 60) particles.shift();
      },
      { passive: true }
    );

    const colors = ["245, 158, 11", "251, 191, 36", "180, 83, 9"];

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p, i) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${colors[i % colors.length]}, ${p.life * 0.35})`;
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
        p.life -= 0.035;
      });
      particles = particles.filter((p) => p.life > 0);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
})();
