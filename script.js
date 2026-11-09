(() => {

    "use strict";


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    const clamp = (
        value,
        min = 0,
        max = 1
    ) => {

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );

    };


    const lerp = (
        a,
        b,
        t
    ) => {

        return (
            a +
            (
                b -
                a
            ) *
            t
        );

    };


    const smoothstep = value => {

        const t =
            clamp(
                value
            );


        return (
            t *
            t *
            (
                3 -
                2 *
                t
            )
        );

    };


    const mixTarget = (
        a,
        b,
        t
    ) => {

        return {

            x:
                lerp(
                    a.x,
                    b.x,
                    t
                ),

            y:
                lerp(
                    a.y,
                    b.y,
                    t
                ),

            z:
                lerp(
                    a.z,
                    b.z,
                    t
                )

        };

    };


    /* =====================================================
       DOM
    ===================================================== */

    const menu =
        document.querySelector(
            ".menu-toggle"
        );


    const nav =
        document.querySelector(
            "#navigation"
        );


    const progressBar =
        document.querySelector(
            ".scroll-progress"
        );


    const transition =
        document.querySelector(
            "#page-transition"
        );


    const flickerElements = [
        ...document.querySelectorAll(
            "[data-flicker]"
        )
    ];


    const chapters = [
        ...document.querySelectorAll(
            ".chapter"
        )
    ];


    const vehicleStory =
        document.querySelector(
            ".vehicle-story"
        );


    const modelViewer =
        document.querySelector(
            "#car-model"
        );


    const modelPlaceholder =
        document.querySelector(
            "#model-placeholder"
        );


    const modelSteps = [
        ...document.querySelectorAll(
            "[data-model-step]"
        )
    ];


    const orbitReadout =
        document.querySelector(
            "#orbit-readout"
        );


    const viewReadout =
        document.querySelector(
            "#view-readout"
        );


    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    /* =====================================================
       PAGE STATE
    ===================================================== */

    let frame =
        0;


    let maxScroll =
        1;


    let chapterData =
        [];


    let transitionTimer =
        0;


    let lastActiveStory =
        null;


    /* =====================================================
       MODEL STATE
    ===================================================== */

    let modelLoaded =
        false;


    let currentModelCandidate =
        0;


    let modelCenter = {

        x: 0,
        y: 0,
        z: 0

    };


    let modelSize = {

        x: 1,
        y: 1,
        z: 1

    };


    let modelLongAxis =
        "z";


    /*
        The FIRST path should be the real file.

        The others are fallbacks in case you
        accidentally uploaded the model using
        one of the previous names.
    */

    const MODEL_CANDIDATES = [

        "./models/heliotech-car-fixed.glb",

        "./models/heliotech-car.glb",

        "./models/Full Assemby.glb",

        "./models/Full Assembly.glb",

        "./heliotech-car-fixed.glb",

        "./heliotech-car.glb",

        "./Full Assemby.glb",

        "./Full Assembly.glb"

    ];


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function closeMenu() {

        if(
            !nav ||
            !menu
        ) {

            return;

        }


        nav.classList.remove(
            "open"
        );


        menu.setAttribute(
            "aria-expanded",
            "false"
        );


        menu.textContent =
            "Menu +";

    }


    if(
        menu &&
        nav
    ) {

        menu.addEventListener(

            "click",

            () => {

                const open =
                    !nav.classList.contains(
                        "open"
                    );


                nav.classList.toggle(
                    "open",
                    open
                );


                menu.setAttribute(
                    "aria-expanded",
                    String(
                        open
                    )
                );


                menu.textContent =
                    open
                    ? "Close −"
                    : "Menu +";

            }

        );


        nav.addEventListener(

            "click",

            event => {

                if(
                    event.target.closest(
                        "a"
                    )
                ) {

                    closeMenu();

                }

            }

        );


        document.addEventListener(

            "keydown",

            event => {

                if(
                    event.key ===
                    "Escape"
                ) {

                    closeMenu();

                }

            }

        );

    }


    /* =====================================================
       PAGE ENTRY TRANSITION
    ===================================================== */

    function revealPage() {

        if(
            !transition
        ) {

            return;

        }


        if(
            reducedMotion.matches
        ) {

            transition.style.display =
                "none";


            return;

        }


        clearTimeout(
            transitionTimer
        );


        transition.className =
            "page-transition";


        transitionTimer =
            window.setTimeout(

                () => {

                    transition
                        .classList
                        .add(
                            "is-revealed"
                        );

                },

                520

            );

    }


    /* =====================================================
       PAGE EXIT TRANSITION
    ===================================================== */

    function navigateWithTransition(
        href
    ) {

        if(
            !transition ||
            reducedMotion.matches
        ) {

            window.location.href =
                href;


            return;

        }


        transition.className =
            "page-transition is-preparing";


        requestAnimationFrame(

            () => {

                requestAnimationFrame(

                    () => {

                        transition.className =
                            "page-transition is-covering";


                        window.setTimeout(

                            () => {

                                window.location.href =
                                    href;

                            },

                            900

                        );

                    }

                );

            }

        );

    }


    /* =====================================================
       SAME-SITE LINK TRANSITION
    ===================================================== */

    document.addEventListener(

        "click",

        event => {

            const link =
                event.target.closest(
                    "a"
                );


            if(
                !link
            ) {

                return;

            }


            const href =
                link.getAttribute(
                    "href"
                );


            if(
                !href ||
                href.startsWith(
                    "#"
                ) ||
                href.startsWith(
                    "mailto:"
                ) ||
                href.startsWith(
                    "tel:"
                )
            ) {

                return;

            }


            if(
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                link.target ===
                "_blank"
            ) {

                return;

            }


            let targetURL;


            try {

                targetURL =
                    new URL(
                        href,
                        window.location.href
                    );

            }
            catch {

                return;

            }


            if(
                targetURL.origin !==
                window.location.origin
            ) {

                return;

            }


            event.preventDefault();


            navigateWithTransition(
                targetURL.href
            );

        }

    );


    /* =====================================================
       TEXT FLICKER
    ===================================================== */

    const flickerObserver =
        new IntersectionObserver(

            entries => {

                entries.forEach(

                    entry => {

                        if(
                            !entry.isIntersecting
                        ) {

                            return;

                        }


                        const element =
                            entry.target;


                        const delay =
                            Number(
                                element.dataset
                                    .flickerDelay ||
                                0
                            );


                        window.setTimeout(

                            () => {

                                element
                                    .classList
                                    .add(
                                        "flicker-visible"
                                    );

                            },

                            delay

                        );


                        flickerObserver
                            .unobserve(
                                element
                            );

                    }

                );

            },

            {

                threshold:
                    0.18,

                rootMargin:
                    "0px 0px -8% 0px"

            }

        );


    flickerElements.forEach(

        (
            element,
            index
        ) => {

            element.dataset
                .flickerDelay =
                    String(
                        (
                            index %
                            3
                        ) *
                        75
                    );


            flickerObserver
                .observe(
                    element
                );

        }

    );


    /* =====================================================
       MODEL PLACEHOLDER STATUS
    ===================================================== */

    function setPlaceholderStatus(
        title,
        message
    ) {

        if(
            !modelPlaceholder
        ) {

            return;

        }


        const strong =
            modelPlaceholder
                .querySelector(
                    "strong"
                );


        const paragraph =
            modelPlaceholder
                .querySelector(
                    "p"
                );


        const code =
            modelPlaceholder
                .querySelector(
                    "code"
                );


        if(
            strong
        ) {

            strong.textContent =
                title;

        }


        if(
            paragraph
        ) {

            paragraph.textContent =
                message;

        }


        if(
            code
        ) {

            const path =
                MODEL_CANDIDATES[
                    currentModelCandidate
                ];


            code.textContent =
                path ||
                "";

        }

    }


    /* =====================================================
       MODEL FILE LOADING
    ===================================================== */

    function tryModelCandidate(
        index
    ) {

        if(
            !modelViewer
        ) {

            return;

        }


        if(
            index >=
            MODEL_CANDIDATES.length
        ) {

            console.error(
                "HelioTech: no GLB model path could be loaded."
            );


            modelLoaded =
                false;


            if(
                vehicleStory
            ) {

                vehicleStory
                    .classList
                    .remove(
                        "model-loaded"
                    );

            }


            modelViewer.style.opacity =
                "0";


            setPlaceholderStatus(

                "MODEL FILE NOT FOUND",

                "Make sure the GLB is committed to the models folder on the main branch."

            );


            return;

        }


        currentModelCandidate =
            index;


        modelLoaded =
            false;


        if(
            vehicleStory
        ) {

            vehicleStory
                .classList
                .remove(
                    "model-loaded"
                );

        }


        modelViewer.style.opacity =
            "0";


        const src =
            MODEL_CANDIDATES[
                index
            ];


        console.log(
            "HelioTech: trying 3D model:",
            src
        );


        setPlaceholderStatus(

            "LOADING 3D MODEL",

            "Loading vehicle geometry..."

        );


        /*
            Critical:

            The source is assigned only AFTER
            the load/error listeners exist.
        */

        modelViewer.src =
            src;

    }


    /* =====================================================
       MODEL LOAD SUCCESS
    ===================================================== */

    function handleModelLoaded() {

        if(
            !modelViewer
        ) {

            return;

        }


        console.log(
            "HelioTech: 3D model loaded:",
            modelViewer.src
        );


        modelLoaded =
            true;


        /*
            Do NOT depend only on CSS for this.

            Setting opacity inline prevents the
            model from remaining invisible if
            older CSS still says opacity: 0.
        */

        modelViewer.style.opacity =
            "1";


        if(
            vehicleStory
        ) {

            vehicleStory
                .classList
                .add(
                    "model-loaded"
                );

        }


        if(
            modelPlaceholder
        ) {

            modelPlaceholder.style.opacity =
                "0";


            modelPlaceholder.style.pointerEvents =
                "none";


            modelPlaceholder.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        /*
            Read actual model dimensions.

            If anything fails here, the model
            STILL stays visible.
        */

        try {

            const center =
                modelViewer
                    .getBoundingBoxCenter();


            const dimensions =
                modelViewer
                    .getDimensions();


            modelCenter = {

                x:
                    center.x,

                y:
                    center.y,

                z:
                    center.z

            };


            modelSize = {

                x:
                    dimensions.x,

                y:
                    dimensions.y,

                z:
                    dimensions.z

            };


            if(
                modelSize.x >=
                    modelSize.y &&
                modelSize.x >=
                    modelSize.z
            ) {

                modelLongAxis =
                    "x";

            }
            else if(
                modelSize.y >=
                    modelSize.x &&
                modelSize.y >=
                    modelSize.z
            ) {

                modelLongAxis =
                    "y";

            }
            else {

                modelLongAxis =
                    "z";

            }


            console.log(
                "HelioTech model dimensions:",
                modelSize
            );


            console.log(
                "HelioTech model center:",
                modelCenter
            );


            console.log(
                "HelioTech model long axis:",
                modelLongAxis
            );

        }
        catch(
            error
        ) {

            console.warn(
                "HelioTech: could not read model dimensions.",
                error
            );

        }


        /*
            Orientation exists in HTML before
            the model loads, so model-viewer
            normally frames it automatically.

            Calling updateFraming again is safe
            and ensures the final frame is correct.
        */

        try {

            if(
                typeof modelViewer
                    .updateFraming ===
                "function"
            ) {

                modelViewer
                    .updateFraming();

            }

        }
        catch(
            error
        ) {

            console.warn(
                "HelioTech: updateFraming failed.",
                error
            );

        }


        updateModel();

    }


    /* =====================================================
       MODEL LOAD FAILURE
    ===================================================== */

    function handleModelError(
        event
    ) {

        console.warn(
            "HelioTech: model failed:",
            MODEL_CANDIDATES[
                currentModelCandidate
            ],
            event
        );


        /*
            Try next possible filename.
        */

        const next =
            currentModelCandidate +
            1;


        window.setTimeout(

            () => {

                tryModelCandidate(
                    next
                );

            },

            100

        );

    }


    /* =====================================================
       INITIALIZE MODEL-VIEWER
    ===================================================== */

    function initializeModel() {

        if(
            !modelViewer
        ) {

            console.error(
                "HelioTech: #car-model element was not found."
            );


            return;

        }


        /*
            Guarantee visible styles independent
            of older CSS.
        */

        modelViewer.style.display =
            "block";


        modelViewer.style.width =
            "100%";


        modelViewer.style.height =
            "100%";


        /*
            Important:
            listeners are installed BEFORE src.
        */

        modelViewer.addEventListener(

            "load",

            handleModelLoaded

        );


        modelViewer.addEventListener(

            "error",

            handleModelError

        );


        /*
            Wait until the custom element library
            has actually registered <model-viewer>.
        */

        if(
            window.customElements &&
            window.customElements.whenDefined
        ) {

            window.customElements
                .whenDefined(
                    "model-viewer"
                )
                .then(

                    () => {

                        /*
                            First use the path written
                            in data-model-src.
                        */

                        const preferred =
                            modelViewer.dataset
                                .modelSrc;


                        if(
                            preferred
                        ) {

                            const existingIndex =
                                MODEL_CANDIDATES
                                    .indexOf(
                                        preferred
                                    );


                            if(
                                existingIndex >
                                0
                            ) {

                                MODEL_CANDIDATES
                                    .splice(
                                        existingIndex,
                                        1
                                    );


                                MODEL_CANDIDATES
                                    .unshift(
                                        preferred
                                    );

                            }
                            else if(
                                existingIndex ===
                                -1
                            ) {

                                MODEL_CANDIDATES
                                    .unshift(
                                        preferred
                                    );

                            }

                        }


                        tryModelCandidate(
                            0
                        );

                    }

                )
                .catch(

                    error => {

                        console.error(
                            "HelioTech: model-viewer library failed to initialize.",
                            error
                        );


                        setPlaceholderStatus(

                            "3D VIEWER FAILED",

                            "The model-viewer library did not load."

                        );

                    }

                );

        }
        else {

            tryModelCandidate(
                0
            );

        }

    }


    /* =====================================================
       MODEL SCROLL PROGRESS
    ===================================================== */

    function modelProgress() {

        if(
            !vehicleStory
        ) {

            return 0;

        }


        const rect =
            vehicleStory
                .getBoundingClientRect();


        const travel =
            Math.max(

                1,

                vehicleStory
                    .offsetHeight -
                window.innerHeight

            );


        return clamp(

            -rect.top /
            travel

        );

    }


    /* =====================================================
       TARGET POINT ALONG CAR
    ===================================================== */

    function modelTarget(
        position
    ) {

        const target = {

            x:
                modelCenter.x,

            y:
                modelCenter.y,

            z:
                modelCenter.z

        };


        target[
            modelLongAxis
        ] +=

            modelSize[
                modelLongAxis
            ] *

            position *

            0.34;


        return target;

    }


    /* =====================================================
       SCROLL CAMERA STATES
    ===================================================== */

    function cameraState(
        progress
    ) {

        const fullStart = {

            orbit:
                88,

            phi:
                72,

            radius:
                115,

            target:
                modelTarget(
                    0
                )

        };


        const solarDetail = {

            orbit:
                75,

            phi:
                67,

            radius:
                64,

            target:
                modelTarget(
                    0.70
                )

        };


        const centerDetail = {

            orbit:
                100,

            phi:
                63,

            radius:
                53,

            target:
                modelTarget(
                    0.06
                )

        };


        const rearDetail = {

            orbit:
                118,

            phi:
                69,

            radius:
                61,

            target:
                modelTarget(
                    -0.68
                )

        };


        const fullEnd = {

            orbit:
                98,

            phi:
                74,

            radius:
                113,

            target:
                modelTarget(
                    0
                )

        };


        /* FULL CAR */

        if(
            progress <
            0.17
        ) {

            const t =
                smoothstep(
                    progress /
                    0.17
                );


            return {

                orbit:
                    lerp(
                        82,
                        fullStart.orbit,
                        t
                    ),

                phi:
                    lerp(
                        75,
                        fullStart.phi,
                        t
                    ),

                radius:
                    lerp(
                        122,
                        fullStart.radius,
                        t
                    ),

                target:
                    fullStart.target

            };

        }


        /* SOLAR / FRONT */

        if(
            progress <
            0.37
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.17
                    ) /
                    0.20

                );


            return {

                orbit:
                    lerp(
                        fullStart.orbit,
                        solarDetail.orbit,
                        t
                    ),

                phi:
                    lerp(
                        fullStart.phi,
                        solarDetail.phi,
                        t
                    ),

                radius:
                    lerp(
                        fullStart.radius,
                        solarDetail.radius,
                        t
                    ),

                target:
                    mixTarget(
                        fullStart.target,
                        solarDetail.target,
                        t
                    )

            };

        }


        /* DRIVER / ELECTRONICS */

        if(
            progress <
            0.59
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.37
                    ) /
                    0.22

                );


            return {

                orbit:
                    lerp(
                        solarDetail.orbit,
                        centerDetail.orbit,
                        t
                    ),

                phi:
                    lerp(
                        solarDetail.phi,
                        centerDetail.phi,
                        t
                    ),

                radius:
                    lerp(
                        solarDetail.radius,
                        centerDetail.radius,
                        t
                    ),

                target:
                    mixTarget(
                        solarDetail.target,
                        centerDetail.target,
                        t
                    )

            };

        }


        /* DRIVETRAIN */

        if(
            progress <
            0.80
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.59
                    ) /
                    0.21

                );


            return {

                orbit:
                    lerp(
                        centerDetail.orbit,
                        rearDetail.orbit,
                        t
                    ),

                phi:
                    lerp(
                        centerDetail.phi,
                        rearDetail.phi,
                        t
                    ),

                radius:
                    lerp(
                        centerDetail.radius,
                        rearDetail.radius,
                        t
                    ),

                target:
                    mixTarget(
                        centerDetail.target,
                        rearDetail.target,
                        t
                    )

            };

        }


        /* PULL BACK */

        const t =
            smoothstep(

                (
                    progress -
                    0.80
                ) /
                0.20

            );


        return {

            orbit:
                lerp(
                    rearDetail.orbit,
                    fullEnd.orbit,
                    t
                ),

            phi:
                lerp(
                    rearDetail.phi,
                    fullEnd.phi,
                    t
                ),

            radius:
                lerp(
                    rearDetail.radius,
                    fullEnd.radius,
                    t
                ),

            target:
                mixTarget(
                    rearDetail.target,
                    fullEnd.target,
                    t
                )

        };

    }


    /* =====================================================
       3D STORY TEXT
    ===================================================== */

    function updateModelStories(
        progress
    ) {

        let current =
            null;


        modelSteps.forEach(

            story => {

                const start =
                    Number(
                        story.dataset
                            .start
                    );


                const end =
                    Number(
                        story.dataset
                            .end
                    );


                const active =
                    progress >=
                        start &&
                    progress <=
                        end;


                story.classList.toggle(
                    "is-active",
                    active
                );


                if(
                    active
                ) {

                    current =
                        story;

                }

            }

        );


        if(
            current &&
            current !==
                lastActiveStory
        ) {

            current.style.opacity =
                "0";


            requestAnimationFrame(

                () => {

                    requestAnimationFrame(

                        () => {

                            current.style.opacity =
                                "";

                        }

                    );

                }

            );


            lastActiveStory =
                current;

        }

    }


    /* =====================================================
       UPDATE MODEL DURING SCROLL
    ===================================================== */

    function updateModel() {

        if(
            !vehicleStory
        ) {

            return;

        }


        const progress =
            modelProgress();


        /*
            Text still changes even if the
            actual GLB is not loaded yet.
        */

        updateModelStories(
            progress
        );


        if(
            !modelViewer ||
            !modelLoaded
        ) {

            return;

        }


        const state =
            cameraState(
                progress
            );


        modelViewer.cameraOrbit =

            `${state.orbit}deg ` +
            `${state.phi}deg ` +
            `${state.radius}%`;


        modelViewer.cameraTarget =

            `${state.target.x}m ` +
            `${state.target.y}m ` +
            `${state.target.z}m`;


        /* UI */

        if(
            orbitReadout
        ) {

            const angle =
                (
                    (
                        state.orbit %
                        360
                    ) +
                    360
                ) %
                360;


            orbitReadout.textContent =

                `${Math
                    .round(
                        angle
                    )
                    .toString()
                    .padStart(
                        3,
                        "0"
                    )}°`;

        }


        if(
            viewReadout
        ) {

            if(
                progress <
                0.17
            ) {

                viewReadout.textContent =
                    "FULL VEHICLE";

            }
            else if(
                progress <
                0.37
            ) {

                viewReadout.textContent =
                    "SOLAR / FRONT";

            }
            else if(
                progress <
                0.59
            ) {

                viewReadout.textContent =
                    "CONTROL / DRIVER";

            }
            else if(
                progress <
                0.80
            ) {

                viewReadout.textContent =
                    "DRIVETRAIN";

            }
            else {

                viewReadout.textContent =
                    "FULL VEHICLE";

            }

        }

    }


    /* =====================================================
       PAGE MEASUREMENT
    ===================================================== */

    function measure() {

        maxScroll =
            Math.max(

                1,

                document
                    .documentElement
                    .scrollHeight -
                window.innerHeight

            );


        chapterData =
            chapters.map(

                chapter => {

                    const rect =
                        chapter
                            .getBoundingClientRect();


                    return {

                        element:
                            chapter,

                        top:
                            rect.top +
                            window.scrollY

                    };

                }

            );


        schedule();

    }


    /* =====================================================
       NAVIGATION ACTIVE STATE
    ===================================================== */

    function updateNavigation() {

        if(
            !nav
        ) {

            return;

        }


        let active =
            chapterData[0]
                ?.element
                .id ||
            "home";


        chapterData.forEach(

            item => {

                if(
                    window.scrollY +
                    window.innerHeight *
                    0.38 >=
                    item.top
                ) {

                    active =
                        item
                            .element
                            .id;

                }

            }

        );


        nav
            .querySelectorAll(
                'a[href^="#"]'
            )
            .forEach(

                link => {

                    if(
                        link.hash ===
                        `#${active}`
                    ) {

                        link.setAttribute(
                            "aria-current",
                            "location"
                        );

                    }
                    else {

                        link.removeAttribute(
                            "aria-current"
                        );

                    }

                }

            );

    }


    /* =====================================================
       MAIN RENDER
    ===================================================== */

    function render() {

        frame =
            0;


        const pageProgress =
            clamp(

                window.scrollY /
                maxScroll

            );


        if(
            progressBar
        ) {

            progressBar.style.transform =
                `scaleX(${pageProgress})`;

        }


        updateNavigation();


        updateModel();

    }


    function schedule() {

        if(
            frame
        ) {

            return;

        }


        frame =
            requestAnimationFrame(
                render
            );

    }


    /* =====================================================
       SCROLL
    ===================================================== */

    window.addEventListener(

        "scroll",

        schedule,

        {
            passive: true
        }

    );


    /* =====================================================
       RESIZE
    ===================================================== */

    let resizeTimer =
        0;


    window.addEventListener(

        "resize",

        () => {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                window.setTimeout(

                    () => {

                        measure();

                        updateModel();

                    },

                    120

                );

        }

    );


    /* =====================================================
       START
    ===================================================== */

    function initialize() {

        measure();


        revealPage();


        initializeModel();


        schedule();

    }


    window.addEventListener(

        "pageshow",

        () => {

            initialize();

        }

    );


    if(
        document.readyState ===
        "complete"
    ) {

        initialize();

    }

})();
