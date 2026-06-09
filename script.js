const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const hero = document.querySelector(".hero");
const logo = document.querySelector(".universe-logo");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

if (hero && logo && window.matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    logo.style.setProperty("--logo-x", `${x * 14}px`);
    logo.style.setProperty("--logo-y", `${y * 14}px`);
  });

  hero.addEventListener("pointerleave", () => {
    logo.style.setProperty("--logo-x", "0px");
    logo.style.setProperty("--logo-y", "0px");
  });
}

const isWoodStonePage = window.location.pathname.includes("wood-stone-soul.html");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (isWoodStonePage) {
  const galleries = [...document.querySelectorAll(".detail-gallery-images")].filter(
    (gallery) => gallery.querySelectorAll("img").length > 1
  );

  const setGalleryHeight = (gallery) => {
    const images = [...gallery.querySelectorAll("img")];
    const width = gallery.getBoundingClientRect().width || gallery.parentElement?.clientWidth || 320;
    const maxHeight = Math.min(window.innerHeight * 0.78, window.innerWidth <= 760 ? 620 : 900);
    const heights = images.map((image) => {
      const imageWidth = Number(image.getAttribute("width")) || image.naturalWidth || width;
      const imageHeight = Number(image.getAttribute("height")) || image.naturalHeight || width;
      return Math.min(width * (imageHeight / imageWidth), maxHeight);
    });
    gallery.style.setProperty("--slideshow-height", `${Math.ceil(Math.max(...heights))}px`);
  };

  galleries.forEach((gallery) => {
    const images = [...gallery.querySelectorAll("img")];
    let activeIndex = 0;

    gallery.classList.add("is-slideshow");
    images.forEach((image, index) => {
      image.classList.toggle("is-active", index === activeIndex);
    });
    setGalleryHeight(gallery);

    if (!prefersReducedMotion) {
      window.setInterval(() => {
        images[activeIndex].classList.remove("is-active");
        activeIndex = (activeIndex + 1) % images.length;
        images[activeIndex].classList.add("is-active");
      }, 5000);
    }
  });

  window.addEventListener("resize", () => {
    galleries.forEach(setGalleryHeight);
  });
}
