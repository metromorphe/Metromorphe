const viewer = document.getElementById("imageViewer");
const viewerCanvas = document.getElementById("viewerCanvas");
const viewerImage = document.getElementById("viewerImage");

const closeViewer = document.getElementById("closeViewer");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetZoomButton = document.getElementById("resetZoom");

const clickableImages = document.querySelectorAll(".clickable-image");

let scale = 1;
let translateX = 0;
let translateY = 0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startingTranslateX = 0;
let startingTranslateY = 0;

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.35;

function updateImageTransform() {
    viewerImage.style.transform =
        `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    viewerCanvas.style.cursor = scale > 1 ? "grab" : "default";
}

function resetViewerPosition() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
}

function setZoom(newScale, cursorX = null, cursorY = null) {
    const oldScale = scale;
    const clampedScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, newScale)
    );

    if (clampedScale === oldScale) {
        return;
    }

    /*
     * When cursor coordinates are supplied, move the image so the point
     * underneath the cursor remains under the cursor while scaling.
     */
    if (cursorX !== null && cursorY !== null) {
        const canvasRect = viewerCanvas.getBoundingClientRect();

        const cursorFromCenterX =
            cursorX - (canvasRect.left + canvasRect.width / 2);

        const cursorFromCenterY =
            cursorY - (canvasRect.top + canvasRect.height / 2);

        const scaleRatio = clampedScale / oldScale;

        translateX =
            cursorFromCenterX -
            (cursorFromCenterX - translateX) * scaleRatio;

        translateY =
            cursorFromCenterY -
            (cursorFromCenterY - translateY) * scaleRatio;
    }

    scale = clampedScale;

    if (scale === 1) {
        translateX = 0;
        translateY = 0;
    }

    updateImageTransform();
}

function openImageViewer(image) {
    viewerImage.src = image.dataset.full || image.src;
    viewerImage.alt = image.alt;

    resetViewerPosition();

    viewer.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeImageViewer() {
    viewer.classList.remove("active");
    document.body.style.overflow = "";

    isDragging = false;
    viewerCanvas.classList.remove("dragging");

    setTimeout(() => {
        viewerImage.src = "";
        viewerImage.alt = "";
        resetViewerPosition();
    }, 250);
}

clickableImages.forEach((image) => {
    image.addEventListener("click", () => {
        openImageViewer(image);
    });
});

zoomInButton.addEventListener("click", () => {
    setZoom(scale + ZOOM_STEP);
});

zoomOutButton.addEventListener("click", () => {
    setZoom(scale - ZOOM_STEP);
});

resetZoomButton.addEventListener("click", resetViewerPosition);

viewerCanvas.addEventListener(
    "wheel",
    (event) => {
        event.preventDefault();

        const direction = event.deltaY < 0 ? 1 : -1;

        setZoom(
            scale + direction * ZOOM_STEP,
            event.clientX,
            event.clientY
        );
    },
    { passive: false }
);

viewerCanvas.addEventListener("mousedown", (event) => {
    if (scale <= 1) {
        return;
    }

    isDragging = true;
    viewerCanvas.classList.add("dragging");

    dragStartX = event.clientX;
    dragStartY = event.clientY;

    startingTranslateX = translateX;
    startingTranslateY = translateY;
});

window.addEventListener("mousemove", (event) => {
    if (!isDragging) {
        return;
    }

    translateX =
        startingTranslateX + (event.clientX - dragStartX);

    translateY =
        startingTranslateY + (event.clientY - dragStartY);

    updateImageTransform();
});

window.addEventListener("mouseup", () => {
    isDragging = false;
    viewerCanvas.classList.remove("dragging");
});

viewerImage.addEventListener("dblclick", () => {
    if (scale === 1) {
        setZoom(2);
    } else {
        resetViewerPosition();
    }
});

closeViewer.addEventListener("click", closeImageViewer);

viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
        closeImageViewer();
    }
});

document.addEventListener("keydown", (event) => {
    if (!viewer.classList.contains("active")) {
        return;
    }

    if (event.key === "Escape") {
        closeImageViewer();
    }

    if (event.key === "+" || event.key === "=") {
        setZoom(scale + ZOOM_STEP);
    }

    if (event.key === "-") {
        setZoom(scale - ZOOM_STEP);
    }

    if (event.key === "0") {
        resetViewerPosition();
    }
});

document.addEventListener("contextmenu", (e) => {
    if (e.target.tagName === "IMG") {
        e.preventDefault();
    }
});

document.querySelectorAll("img").forEach(img => {
    img.setAttribute("draggable", "false");
});

viewerImage.addEventListener("contextmenu", e => {
    e.preventDefault();
});

/* ==========================================
   LANGUAGE SWITCHER
========================================== */

const languageButton = document.getElementById("languageButton");

const translatableElements = document.querySelectorAll(
    "[data-en][data-fr]"
);

const translatedAltElements = document.querySelectorAll(
    "[data-alt-en][data-alt-fr]"
);

const translatedAriaElements = document.querySelectorAll(
    "[data-aria-en][data-aria-fr]"
);

let currentLanguage =
    localStorage.getItem("metromorphe-language") || "fr";

function setLanguage(language) {
    currentLanguage = language;

    document.documentElement.lang = language;

    translatableElements.forEach((element) => {
        element.innerHTML = element.dataset[language];
    });

    translatedAltElements.forEach((element) => {
        element.alt =
            language === "fr"
                ? element.dataset.altFr
                : element.dataset.altEn;
    });

    translatedAriaElements.forEach((element) => {
        element.setAttribute(
            "aria-label",
            language === "fr"
                ? element.dataset.ariaFr
                : element.dataset.ariaEn
        );
    });

    languageButton.textContent =
        language === "fr" ? "EN" : "FR";

    languageButton.setAttribute(
        "aria-label",
        language === "fr"
            ? "Afficher le site en anglais"
            : "View the site in French"
    );

    localStorage.setItem(
        "metromorphe-language",
        language
    );
}

languageButton.addEventListener("click", () => {
    const nextLanguage =
        currentLanguage === "fr" ? "en" : "fr";

    setLanguage(nextLanguage);
});

setLanguage(currentLanguage);

/* ==========================================
   MOBILE NAVIGATION
========================================== */

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-header nav");

function closeMobileMenu() {
    navigation.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("is-open");

        menuToggle.classList.toggle("is-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMobileMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 800) {
            closeMobileMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });
}