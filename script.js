(() => {

    "use strict";

    /* =====================================================
       HELIOTECH 3D SETTINGS
    ===================================================== */

    const VEHICLE_SCROLL_HEIGHT = "1100vh";   // applied to every .vehicle-story
    const FULL_VIEW_DISTANCE = 150;
    const DETAIL_DISTANCE = 42;
    const WHEEL_DISTANCE = 30;
    const EXTREME_CLOSE_DISTANCE = 27;
    const TRANSITION_FLAG = "heliotech-transition-incoming";

    /*
        Per-vehicle settings, keyed by the <model-viewer> id.
        - candidates: GLB files to try, in order
        - orientation: change this if the chassis loads rotated
        - labels: optional readout renames (the tour is shared)
    */
    const VEHICLE_CONFIGS = {

        "car-model": {
            candidates: [
                "./models/heliotech-car-fixed.glb",
                "./models/heliotech-car.glb",
                "./models/Full Assemby.glb",
                "./models/Full Assembly.glb",
                "./heliotech-car-fixed.glb",
                "./heliotech-car.glb",
                "./Full Assemby.glb",
                "./Full Assembly.glb"
            ],
            orientation: "0deg -90deg 0deg",
            labels: {}
        },

        "chassis-model": {
            candidates: [
                "./models/Cruizer Chassis Frame.glb",
                "./models/Cruiser Chassis Frame.glb",
                "./models/cruiser-chassis-frame.glb",
                "./Cruizer Chassis Frame.glb"
            ],
            orientation: "0deg -90deg 0deg",
            labels: {
                "FULL VEHICLE / FRONT": "FULL CHASSIS / FRONT",
                "FULL VEHICLE": "FULL CHASSIS",
                "FULL VEHICLE / COMPLETE": "FULL CHASSIS / COMPLETE",
                "FRONT WHEEL / LEFT": "FRONT SUSPENSION / LEFT",
                "FRONT WHEEL / RIGHT": "FRONT SUSPENSION / RIGHT",
                "REAR WHEEL / LEFT": "REAR SUSPENSION / LEFT",
                "REAR WHEEL / RIGHT": "REAR SUSPENSION / RIGHT",
                "DRIVER / COCKPIT": "DRIVER CELL",
                "ELECTRONICS / CENTER": "CENTER SECTION",
                "SOLAR ARRAY / TOP": "UPPER FRAME",
                "LOW ANGLE / CHASSIS": "LOW ANGLE / UNDERSIDE"
            }
        }

    };

    const MODEL_COLORS = [
        "#aebbc4", "#75c9ee", "#ff9f43", "#68747d", "#98a7b1",
        "#a5b8f3", "#c2cdd4", "#758690", "#bbb6ae", "#527fe5",
        "#ffc44c", "#a9def4", "#68c978", "#6677df", "#b7c4cc"
    ];

    /* =====================================================
       HELPERS
    ===================================================== */

    const clamp = (value, min = 0, max = 1) =>
        Math.max(min, Math.min(max, value));

    const lerp = (a, b, t) => a + (b - a) * t;

    const smoothstep = value => {
        const t = clamp(value);
        return t * t * (3 - 2 * t);
    };

    const mixTarget = (a, b, t) => ({
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t)
    });

    /* =====================================================
       DOM
    ===================================================== */

    const menu = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#navigation");
    const progressBar = document.querySelector(".scroll-progress");
    const transition = document.querySelector("#page-transition");
    const flickerElements = [...document.querySelectorAll("[data-flicker]")];
    const chapters = [...document.querySelectorAll(".chapter")];
    const vehicleStories = [...document.querySelectorAll(".vehicle-story")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* =====================================================
       PAGE STATE
    ===================================================== */

    let frame = 0;
    let maxScroll = 1;
    let chapterData = [];
    let transitionTimer = 0;
    let initialized = false;
    let pageRevealStarted = false;

    /* =====================================================
       VEHICLE (one instance per .vehicle-story section)
    ===================================================== */

    function createVehicle(story) {

        const viewer = story.querySelector("model-viewer");
        if (!viewer) return null;

        const config = VEHICLE_CONFIGS[viewer.id] || {};
        const orientation = config.orientation || "0deg -90deg 0deg";
        const labels = config.labels || {};

        const placeholder = story.querySelector(".model-placeholder");
        const steps = [...story.querySelectorAll("[data-model-step]")];
        const orbitReadout = story.querySelector(".vehicle-topbar span:last-child");
        const viewReadout = story.querySelector(".vehicle-bottom span:first-child");

        const candidates = [...(config.candidates || [])];

        let modelLoaded = false;
        let currentCandidate = 0;
        let lastActiveStory = null;
        let cameraTour = [];

        let modelCenter = { x: 0, y: 0, z: 0 };
        let modelSize = { x: 1, y: 1, z: 1 };
        let longAxis = "z";
        let widthAxis = "x";
        let heightAxis = "y";

        story.style.height = VEHICLE_SCROLL_HEIGHT;

        /* ---------- placeholder ---------- */

        function setPlaceholderStatus(title, message) {
            if (!placeholder) return;
            const strong = placeholder.querySelector("strong");
            const paragraph = placeholder.querySelector("p");
            const code = placeholder.querySelector("code");
            if (strong) strong.textContent = title;
            if (paragraph) paragraph.textContent = message;
            if (code) code.textContent = candidates[currentCandidate] || "";
        }

        /* ---------- materials ---------- */

        function applyModelMaterialFixes() {

            if (!viewer.model || !viewer.model.materials) return;

            viewer.model.materials.forEach((material, index) => {
                try {
                    if (typeof material.setDoubleSided === "function") {
                        material.setDoubleSided(true);
                    }

                    const pbr = material.pbrMetallicRoughness;
                    if (!pbr) return;

                    pbr.setBaseColorFactor(MODEL_COLORS[index] || "#b9c5cd");
                    pbr.setMetallicFactor(.03);
                    pbr.setRoughnessFactor(.78);

                    if (typeof material.setAlphaMode === "function") {
                        material.setAlphaMode("OPAQUE");
                    }
                } catch (error) {
                    console.warn("Material error:", index, error);
                }
            });

            viewer.environmentImage = "neutral";
            viewer.setAttribute("tone-mapping", "neutral");
            viewer.exposure = 1.18;
            viewer.shadowIntensity = 0;
        }

        /* ---------- try model files ---------- */

        function tryModelCandidate(index) {

            if (index >= candidates.length) {
                console.error("No GLB model found for", viewer.id);
                modelLoaded = false;
                viewer.style.opacity = "0";
                story.classList.remove("model-loaded");
                setPlaceholderStatus(
                    "MODEL FILE NOT FOUND",
                    "Make sure the GLB is inside the models folder."
                );
                return;
            }

            currentCandidate = index;
            modelLoaded = false;
            viewer.style.opacity = "0";

            setPlaceholderStatus("LOADING 3D MODEL", "Loading HelioTech vehicle...");

            viewer.src = candidates[index];
        }

        /* ---------- axes ---------- */

        function detectModelAxes() {
            const dimensions = [
                { axis: "x", size: modelSize.x },
                { axis: "y", size: modelSize.y },
                { axis: "z", size: modelSize.z }
            ];

            dimensions.sort((a, b) => b.size - a.size);

            longAxis = dimensions[0].axis;
            widthAxis = dimensions[1].axis;
            heightAxis = dimensions[2].axis;

            console.log(viewer.id, "axes:", {
                long: longAxis, width: widthAxis, height: heightAxis
            });
        }

        function modelTarget(longPosition = 0, widthPosition = 0, heightPosition = 0) {
            const target = {
                x: modelCenter.x,
                y: modelCenter.y,
                z: modelCenter.z
            };

            target[longAxis] += modelSize[longAxis] * longPosition * .40;
            target[widthAxis] += modelSize[widthAxis] * widthPosition * .40;
            target[heightAxis] += modelSize[heightAxis] * heightPosition * .32;

            return target;
        }

        /* ---------- camera tour (identical for every vehicle) ---------- */

        function buildCameraTour() {

            const stop = (p, orbit, phi, radius, target, label) => ({
                p, orbit, phi, radius, target,
                label: labels[label] || label
            });

            cameraTour = [
                stop(0.00,   0, 72, 165, modelTarget(0, 0, 0), "FULL VEHICLE / FRONT"),
                stop(.055,  18, 70, 145, modelTarget(0, 0, 0), "FULL VEHICLE"),
                stop(.11,   30, 69,  58, modelTarget(.67, 0, 0), "FRONT"),
                stop(.17,   48, 70, DETAIL_DISTANCE, modelTarget(.60, -.20, 0), "FRONT / LEFT"),
                stop(.23,   70, 78, WHEEL_DISTANCE, modelTarget(.58, -.42, -.18), "FRONT WHEEL / LEFT"),
                stop(.29,   90, 70,  54, modelTarget(.10, -.16, 0), "LEFT SIDE"),
                stop(.35,  110, 60, EXTREME_CLOSE_DISTANCE, modelTarget(.08, -.05, .12), "DRIVER / COCKPIT"),
                stop(.41,  132, 66,  31, modelTarget(-.06, 0, .04), "ELECTRONICS / CENTER"),
                stop(.47,  150, 78, WHEEL_DISTANCE, modelTarget(-.60, -.42, -.18), "REAR WHEEL / LEFT"),
                stop(.53,  180, 70,  61, modelTarget(-.68, 0, 0), "REAR"),
                stop(.59,  215, 78, WHEEL_DISTANCE, modelTarget(-.60, .42, -.18), "REAR WHEEL / RIGHT"),
                stop(.65,  270, 70,  53, modelTarget(0, .16, 0), "RIGHT SIDE"),
                stop(.71,  300, 78, WHEEL_DISTANCE, modelTarget(.58, .42, -.18), "FRONT WHEEL / RIGHT"),
                stop(.77,  330, 67, DETAIL_DISTANCE, modelTarget(.50, .20, 0), "FRONT / RIGHT"),
                stop(.83,  360, 22,  75, modelTarget(0, 0, .05), "TOP VIEW"),
                stop(.88,  390, 29,  38, modelTarget(.15, 0, .24), "SOLAR ARRAY / TOP"),
                stop(.93,  420, 108, 45, modelTarget(0, 0, -.22), "LOW ANGLE / CHASSIS"),
                stop(.97,  450, 72, 145, modelTarget(0, 0, 0), "FULL VEHICLE"),
                stop(1.00, 500, 68, 155, modelTarget(0, 0, 0), "FULL VEHICLE / COMPLETE")
            ];
        }

        function cameraState(progress) {

            if (cameraTour.length < 2) {
                return {
                    orbit: 0,
                    phi: 72,
                    radius: FULL_VIEW_DISTANCE,
                    target: modelCenter,
                    label: labels["FULL VEHICLE"] || "FULL VEHICLE"
                };
            }

            if (progress <= cameraTour[0].p) return cameraTour[0];

            if (progress >= cameraTour[cameraTour.length - 1].p) {
                return cameraTour[cameraTour.length - 1];
            }

            for (let i = 0; i < cameraTour.length - 1; i++) {

                const start = cameraTour[i];
                const end = cameraTour[i + 1];

                if (progress >= start.p && progress <= end.p) {

                    const rawT = (progress - start.p) / (end.p - start.p);
                    const t = smoothstep(rawT);

                    return {
                        orbit: lerp(start.orbit, end.orbit, t),
                        phi: lerp(start.phi, end.phi, t),
                        radius: lerp(start.radius, end.radius, t),
                        target: mixTarget(start.target, end.target, t),
                        label: rawT < .50 ? start.label : end.label
                    };
                }
            }

            return cameraTour[cameraTour.length - 1];
        }

        /* ---------- load / error ---------- */

        function handleModelLoaded() {

            console.log("HelioTech model loaded:", viewer.src);

            modelLoaded = true;
            viewer.orientation = orientation;
            viewer.style.opacity = "1";
            story.classList.add("model-loaded");

            if (placeholder) {
                placeholder.style.opacity = "0";
                placeholder.style.pointerEvents = "none";
                placeholder.setAttribute("aria-hidden", "true");
            }

            try {
                applyModelMaterialFixes();

                if (typeof viewer.updateFraming === "function") {
                    viewer.updateFraming();
                }

                const center = viewer.getBoundingBoxCenter();
                const dimensions = viewer.getDimensions();

                modelCenter = { x: center.x, y: center.y, z: center.z };
                modelSize = { x: dimensions.x, y: dimensions.y, z: dimensions.z };

                detectModelAxes();
                buildCameraTour();

                console.log(viewer.id, "center:", modelCenter, "size:", modelSize);

            } catch (error) {
                console.warn("Unable to prepare model:", error);
            }

            requestAnimationFrame(() => {
                try {
                    applyModelMaterialFixes();
                    if (typeof viewer.updateFraming === "function") {
                        viewer.updateFraming();
                    }
                } catch (error) {
                    console.warn(error);
                }

                update();
            });
        }

        function handleModelError(event) {
            console.warn("Model failed:", candidates[currentCandidate], event);

            window.setTimeout(() => {
                tryModelCandidate(currentCandidate + 1);
            }, 120);
        }

        /* ---------- init ---------- */

        function initializeModel() {

            const htmlSource = viewer.dataset.modelSrc || viewer.getAttribute("src");

            if (viewer.hasAttribute("src")) viewer.removeAttribute("src");

            viewer.style.display = "block";
            viewer.style.width = "100%";
            viewer.style.height = "100%";
            viewer.orientation = orientation;
            viewer.environmentImage = "neutral";
            viewer.setAttribute("tone-mapping", "neutral");
            viewer.exposure = 1.18;
            viewer.shadowIntensity = 0;

            viewer.addEventListener("load", handleModelLoaded);
            viewer.addEventListener("error", handleModelError);

            /* Put the file named in the HTML first, as before. */
            if (htmlSource) {
                const existingIndex = candidates.indexOf(htmlSource);

                if (existingIndex > 0) {
                    candidates.splice(existingIndex, 1);
                    candidates.unshift(htmlSource);
                } else if (existingIndex === -1) {
                    candidates.unshift(htmlSource);
                }
            }

            if (window.customElements && window.customElements.whenDefined) {
                window.customElements
                    .whenDefined("model-viewer")
                    .then(() => tryModelCandidate(0))
                    .catch(error => {
                        console.error("model-viewer failed:", error);
                        setPlaceholderStatus(
                            "3D VIEWER FAILED",
                            "The 3D viewer library could not load."
                        );
                    });
            } else {
                tryModelCandidate(0);
            }
        }

        /* ---------- scroll progress + story text ---------- */

        function progressOf() {
            const rect = story.getBoundingClientRect();
            const travel = Math.max(1, story.offsetHeight - window.innerHeight);
            return clamp(-rect.top / travel);
        }

        function updateStories(progress) {

            let current = null;

            steps.forEach(step => {
                const start = Number(step.dataset.start);
                const end = Number(step.dataset.end);
                const active = progress >= start && progress <= end;

                step.classList.toggle("is-active", active);

                if (active) current = step;
            });

            if (current && current !== lastActiveStory) {

                current.style.opacity = "0";

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        current.style.opacity = "";
                    });
                });

                lastActiveStory = current;
            }
        }

        function update() {

            const progress = progressOf();

            updateStories(progress);

            if (!modelLoaded) return;

            const state = cameraState(progress);

            viewer.cameraOrbit =
                `${state.orbit}deg ${state.phi}deg ${state.radius}%`;

            viewer.cameraTarget =
                `${state.target.x}m ${state.target.y}m ${state.target.z}m`;

            if (orbitReadout) {
                const angle = ((state.orbit % 360) + 360) % 360;
                orbitReadout.textContent =
                    `${Math.round(angle).toString().padStart(3, "0")}°`;
            }

            if (viewReadout) viewReadout.textContent = state.label;
        }

        initializeModel();

        return { update };
    }

    const vehicles = vehicleStories.map(createVehicle).filter(Boolean);

    function updateVehicles() {
        vehicles.forEach(vehicle => vehicle.update());
    }

    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function closeMenu() {
        if (!nav || !menu) return;
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.textContent = "Menu +";
    }

    if (menu && nav) {

        menu.addEventListener("click", () => {
            const open = !nav.classList.contains("open");
            nav.classList.toggle("open", open);
            menu.setAttribute("aria-expanded", String(open));
            menu.textContent = open ? "Close −" : "Menu +";
        });

        nav.addEventListener("click", event => {
            if (event.target.closest("a")) closeMenu();
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeMenu();
        });
    }

    /* =====================================================
       PAGE TRANSITION
    ===================================================== */

    function isIncomingTransition() {
        try {
            const incoming = sessionStorage.getItem(TRANSITION_FLAG);

            if (incoming === "1") {
                sessionStorage.removeItem(TRANSITION_FLAG);
                return true;
            }
        } catch (error) {
            console.warn(error);
        }

        return false;
    }

    function revealPageOnce() {

        if (pageRevealStarted) return;

        pageRevealStarted = true;

        if (!transition) return;

        if (reducedMotion.matches) {
            transition.style.display = "none";
            return;
        }

        clearTimeout(transitionTimer);

        if (isIncomingTransition()) {

            transition.className = "page-transition is-arriving";

            transitionTimer = window.setTimeout(() => {
                transition.className = "page-transition is-revealed";
            }, 180);

            return;
        }

        transition.className = "page-transition is-entering";

        transitionTimer = window.setTimeout(() => {
            transition.className = "page-transition is-revealed";
        }, 760);
    }

    function navigateWithTransition(href) {

        if (!transition || reducedMotion.matches) {
            window.location.href = href;
            return;
        }

        transition.className = "page-transition is-preparing";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {

                transition.className = "page-transition is-covering";

                window.setTimeout(() => {
                    try {
                        sessionStorage.setItem(TRANSITION_FLAG, "1");
                    } catch (error) {
                        console.warn(error);
                    }

                    window.location.href = href;
                }, 950);
            });
        });
    }

    /* =====================================================
       INTERNAL LINKS
    ===================================================== */

    document.addEventListener("click", event => {

        const link = event.target.closest("a");
        if (!link) return;

        const href = link.getAttribute("href");

        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")
        ) return;

        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            link.target === "_blank"
        ) return;

        let targetURL;

        try {
            targetURL = new URL(href, window.location.href);
        } catch {
            return;
        }

        if (targetURL.origin !== window.location.origin) return;

        event.preventDefault();

        navigateWithTransition(targetURL.href);
    });

    /* =====================================================
       TEXT FLICKER
    ===================================================== */

    const flickerObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {

                if (!entry.isIntersecting) return;

                const element = entry.target;
                const delay = Number(element.dataset.flickerDelay || 0);

                window.setTimeout(() => {
                    element.classList.add("flicker-visible");
                }, delay);

                flickerObserver.unobserve(element);
            });
        },
        {
            threshold: .18,
            rootMargin: "0px 0px -8% 0px"
        }
    );

    flickerElements.forEach((element, index) => {
        element.dataset.flickerDelay = String((index % 3) * 75);
        flickerObserver.observe(element);
    });

    /* =====================================================
       PAGE MEASUREMENT
    ===================================================== */

    function measure() {

        maxScroll = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight
        );

        chapterData = chapters.map(chapter => {
            const rect = chapter.getBoundingClientRect();
            return {
                element: chapter,
                top: rect.top + window.scrollY
            };
        });

        schedule();
    }

    /* =====================================================
       ACTIVE NAV
    ===================================================== */

    function updateNavigation() {

        if (!nav) return;

        let active = chapterData[0]?.element.id || "home";

        chapterData.forEach(item => {
            if (window.scrollY + window.innerHeight * .38 >= item.top) {
                active = item.element.id;
            }
        });

        nav.querySelectorAll('a[href^="#"]').forEach(link => {
            if (link.hash === `#${active}`) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    /* =====================================================
       RENDER
    ===================================================== */

    function render() {

        frame = 0;

        const pageProgress = clamp(window.scrollY / maxScroll);

        if (progressBar) {
            progressBar.style.transform = `scaleX(${pageProgress})`;
        }

        updateNavigation();
        updateVehicles();
    }

    function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(render);
    }

    window.addEventListener("scroll", schedule, { passive: true });

    let resizeTimer = 0;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = window.setTimeout(() => {
            measure();
            updateVehicles();
        }, 120);
    });

    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        if (initialized) return;

        initialized = true;

        measure();
        revealPageOnce();
        schedule();
    }

    initialize();

    window.addEventListener("pageshow", event => {
        if (event.persisted) {

            if (transition) {
                transition.className = "page-transition is-revealed";
            }

            measure();
            schedule();
        }
    });

})();
