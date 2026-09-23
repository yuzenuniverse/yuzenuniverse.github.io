const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const hero = document.querySelector(".hero");
const logo = document.querySelector(".universe-logo");
const siteHeader = document.querySelector(".site-header");

// 捲離首屏後給頁首加上 .is-scrolled，讓它的底色壓實，
// 內文才不會透過半透明的導覽列疊在標題上。
if (siteHeader) {
  let headerTicking = false;
  const syncHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
    headerTicking = false;
  };
  syncHeaderState();
  window.addEventListener(
    "scroll",
    () => {
      if (headerTicking) return;
      headerTicking = true;
      window.requestAnimationFrame(syncHeaderState);
    },
    { passive: true }
  );
}

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

// 進站時若指定 #early-works（或 ?section=early-works），要把訪客定位到該區。
// 麻煩的是圖片陸續載入會讓頁面長高，一次定位會落在錯的位置；但舊版改用
// 250ms × 20 次的 setInterval 無條件拉回，等於讓人有整整 5 秒捲不動頁面。
// 下面的做法是：持續校正到版面穩定為止，但訪客一有動作就立刻交還控制權。
let lastProgrammaticTop = null;
let correctionTimer = null;
let userTookOver = false;

const stopCorrecting = () => {
  if (correctionTimer !== null) {
    window.clearInterval(correctionTimer);
    correctionTimer = null;
  }
};

const releaseControl = () => {
  userTookOver = true;
  stopCorrecting();
};

["wheel", "touchstart", "keydown", "pointerdown"].forEach((type) => {
  window.addEventListener(type, releaseControl, { passive: true, once: true });
});

const scrollToEarlyWorks = () => {
  const params = new URLSearchParams(window.location.search);
  const shouldScroll = window.location.hash === "#early-works" || params.get("section") === "early-works";
  if (!shouldScroll) return;

  const target = document.querySelector("#early-works");
  const header = document.querySelector(".site-header");
  if (!target) return;

  const headerOffset = header instanceof HTMLElement ? header.offsetHeight + 28 : 96;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
  // 必須寫 "instant"：behavior:"auto" 是「沿用 CSS 的 scroll-behavior」，
  // 而 html 設了 scroll-behavior: smooth，會變成動畫捲動，
  // 導致下一行讀回來的位置還是舊的。
  window.scrollTo({ top, behavior: "instant" });
  // 讀回實際落點：文件還不夠高時瀏覽器會把捲動位置夾住，
  // 記錄夾住後的值才能正確判斷「訪客是不是自己捲走了」。
  lastProgrammaticTop = window.scrollY;

  if (params.get("section") === "early-works" && window.history.replaceState) {
    window.history.replaceState(null, "", `${window.location.pathname}#early-works`);
  }
};

const settleEarlyWorks = () => {
  if (userTookOver) return;
  scrollToEarlyWorks();
  stopCorrecting();

  let attempts = 0;
  correctionTimer = window.setInterval(() => {
    attempts += 1;
    const movedByUser = lastProgrammaticTop !== null && Math.abs(window.scrollY - lastProgrammaticTop) > 4;
    if (userTookOver || movedByUser || attempts > 12) {
      stopCorrecting();
      return;
    }
    scrollToEarlyWorks();
  }, 250);
};

settleEarlyWorks();
window.addEventListener("load", settleEarlyWorks);
window.addEventListener("hashchange", scrollToEarlyWorks);

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
    let timer = null;

    gallery.classList.add("is-slideshow");
    images.forEach((image, index) => {
      image.classList.toggle("is-active", index === activeIndex);
    });
    setGalleryHeight(gallery);

    // 原本只是每 5 秒默默換圖：訪客不知道底下還有幾張，也沒有辦法停下來
    // （自動更新超過 5 秒卻無法暫停，不符合 WCAG 2.2.2）。
    // 這裡補上圓點指示與播放/暫停鍵，順便讓偏好減少動態的人也能自己翻看每一張。
    const controls = document.createElement("div");
    controls.className = "slideshow-controls";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "slideshow-toggle";

    const dots = images.map((image, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slideshow-dot";
      dot.setAttribute("aria-label", `顯示第 ${index + 1} 張，共 ${images.length} 張 / Show image ${index + 1} of ${images.length}`);
      dot.addEventListener("click", () => {
        stop();
        show(index);
      });
      return dot;
    });

    const show = (index) => {
      images[activeIndex].classList.remove("is-active");
      activeIndex = index;
      images[activeIndex].classList.add("is-active");
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-current", i === activeIndex);
        if (i === activeIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => show((activeIndex + 1) % images.length), 5000);
      toggle.classList.add("is-playing");
      toggle.setAttribute("aria-label", "暫停自動播放 / Pause slideshow");
      toggle.setAttribute("aria-pressed", "false");
    };

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      toggle.classList.remove("is-playing");
      toggle.setAttribute("aria-label", "開始自動播放 / Play slideshow");
      toggle.setAttribute("aria-pressed", "true");
    };

    toggle.addEventListener("click", () => (timer === null ? start() : stop()));

    dots.forEach((dot) => controls.appendChild(dot));
    controls.appendChild(toggle);
    gallery.insertAdjacentElement("afterend", controls);

    show(0);
    if (prefersReducedMotion) stop();
    else start();
  });

  window.addEventListener("resize", () => {
    galleries.forEach(setGalleryHeight);
  });
}
