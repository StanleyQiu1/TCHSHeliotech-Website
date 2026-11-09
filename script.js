(() => {

    "use strict";


    /* =====================================================
       HELIOTECH SETTINGS
    ===================================================== */

    const VEHICLE_SCROLL_HEIGHT =
        "700vh";


    /*
        Fusion correction:

        90deg = lays car horizontally
        180deg = flips upside-down car upright
    */

    const MODEL_ORIENTATION =
        "180deg 90deg 0deg";


    /*
        Larger = farther from car.

        150 gives the full car plenty
        of room on screen.
    */

    const FULL_VIEW_DISTANCE =
        150;


    const TRANSITION_FLAG =
        "heliotech-transition-incoming";


    /* =====================================================
       HELPERS
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


    let lastActiveStory =
        null;


    let transitionTimer =
        0;


    let initialized =
        false;


    let pageRevealStarted =
        false;


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


    /* =====================================================
       POSSIBLE MODEL FILENAMES
    ===================================================== */

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
       EXTEND 3D SCROLL
    ===================================================== */

    if(
        vehicleStory
    ) {

        vehicleStory.style.height =
            VEHICLE_SCROLL_HEIGHT;

    }


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
       CHECK IF WE CAME FROM ANOTHER HELIOTECH PAGE
    ===================================================== */

    function isIncomingTransition() {

        try {

            const incoming =
                sessionStorage.getItem(
                    TRANSITION_FLAG
                );


            if(
                incoming ===
                "1"
            ) {

                sessionStorage.removeItem(
                    TRANSITION_FLAG
                );


                return true;

            }

        }
        catch(
            error
        ) {

            console.warn(
                "Transition storage unavailable.",
                error
            );

        }


        return false;

    }


    /* =====================================================
       PAGE ENTRY TRANSITION
    ===================================================== */

    function revealPageOnce() {

        /*
            Prevent pageshow + initialization
            from restarting the logo animation.

            This was one cause of the
            double flicker.
        */

        if(
            pageRevealStarted
        ) {

            return;

        }


        pageRevealStarted =
            true;


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


        const incoming =
            isIncomingTransition();


        /*
            IMPORTANT:

            If we came from another page,
            the logo ALREADY flickered once
            during the outgoing transition.

            Therefore DO NOT flicker again.

            Just show it solid for a moment
            and slide the panel away.
        */

        if(
            incoming
        ) {

            transition.className =
                "page-transition is-arriving";


            transitionTimer =
                window.setTimeout(

                    () => {

                        transition.className =
                            "page-transition is-revealed";

                    },

                    180

                );


            return;

        }


        /*
            Fresh website visit:

            Let the logo flicker exactly
            ONE time before revealing page.
        */

        transition.className =
            "page-transition is-entering";


        transitionTimer =
            window.setTimeout(

                () => {

                    transition.className =
                        "page-transition is-revealed";

                },

                650

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


        /*
            Reset panel off-screen right.
            Logo hidden.
        */

        transition.className =
            "page-transition is-preparing";


        requestAnimationFrame(

            () => {

                requestAnimationFrame(

                    () => {

                        /*
                            Slanted panel enters.

                            Logo flickers exactly
                            ONE time here.
                        */

                        transition.className =
                            "page-transition is-covering";


                        window.setTimeout(

                            () => {

                                /*
                                    Tell destination page:

                                    "The logo already flickered.
                                    Do not flicker again."
                                */

                                try {

                                    sessionStorage.setItem(
                                        TRANSITION_FLAG,
                                        "1"
                                    );

                                }
                                catch(
                                    error
                                ) {

                                    console.warn(
                                        error
                                    );

                                }


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
       INTERCEPT SAME-SITE PAGE LINKS
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


            /*
                Hash links stay on same page
                and should NOT trigger transition.
            */

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


            /*
                Preserve Ctrl/Cmd click etc.
            */

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


            /*
                External sites behave normally.
            */

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


                        flickerObserver.unobserve(
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

            element.dataset.flickerDelay =
                String(
                    (
                        index %
                        3
                    ) *
                    75
                );


            flickerObserver.observe(
                element
            );

        }

    );


    /* =====================================================
       MODEL PLACEHOLDER
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
            modelPlaceholder.querySelector(
                "strong"
            );


        const paragraph =
            modelPlaceholder.querySelector(
                "p"
            );


        const code =
            modelPlaceholder.querySelector(
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

            code.textContent =
                MODEL_CANDIDATES[
                    currentModelCandidate
                ] ||
                "";

        }

    }


    /* =====================================================
       LOAD MODEL CANDIDATE
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
                "HelioTech: no 3D model could be loaded."
            );


            modelLoaded =
                false;


            modelViewer.style.opacity =
                "0";


            if(
                vehicleStory
            ) {

                vehicleStory.classList.remove(
                    "model-loaded"
                );

            }


            setPlaceholderStatus(

                "MODEL FILE NOT FOUND",

                "Make sure the GLB file is inside the models folder."

            );


            return;

        }


        currentModelCandidate =
            index;


        modelLoaded =
            false;


        modelViewer.style.opacity =
            "0";


        if(
            vehicleStory
        ) {

            vehicleStory.classList.remove(
                "model-loaded"
            );

        }


        const src =
            MODEL_CANDIDATES[
                index
            ];


        console.log(
            "HelioTech loading model:",
            src
        );


        setPlaceholderStatus(

            "LOADING 3D MODEL",

            "Loading vehicle geometry..."

        );


        modelViewer.src =
            src;

    }


    /* =====================================================
       MODEL LOADED
    ===================================================== */

    function handleModelLoaded() {

        console.log(
            "HelioTech model loaded:",
            modelViewer.src
        );


        modelLoaded =
            true;


        /*
            Correct Fusion orientation.

            90° lays the vehicle horizontal.
            180° flips it upright.
        */

        modelViewer.orientation =
            MODEL_ORIENTATION;


        modelViewer.style.opacity =
            "1";


        if(
            vehicleStory
        ) {

            vehicleStory.classList.add(
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


        try {

            /*
                Reframe after orientation.
            */

            if(
                typeof modelViewer.updateFraming ===
                "function"
            ) {

                modelViewer.updateFraming();

            }


            const center =
                modelViewer.getBoundingBoxCenter();


            const dimensions =
                modelViewer.getDimensions();


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


            /*
                Find the longest car axis.
            */

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
                "Model center:",
                modelCenter
            );


            console.log(
                "Model dimensions:",
                modelSize
            );


            console.log(
                "Model long axis:",
                modelLongAxis
            );

        }
        catch(
            error
        ) {

            console.warn(
                "Unable to read model dimensions.",
                error
            );

        }


        requestAnimationFrame(

            () => {

                try {

                    if(
                        typeof modelViewer.updateFraming ===
                        "function"
                    ) {

                        modelViewer.updateFraming();

                    }

                }
                catch(
                    error
                ) {

                    console.warn(
                        error
                    );

                }


                updateModel();

            }

        );

    }


    /* =====================================================
       MODEL ERROR
    ===================================================== */

    function handleModelError(
        event
    ) {

        console.warn(

            "Model failed:",

            MODEL_CANDIDATES[
                currentModelCandidate
            ],

            event

        );


        window.setTimeout(

            () => {

                tryModelCandidate(

                    currentModelCandidate +
                    1

                );

            },

            120

        );

    }


    /* =====================================================
       INITIALIZE MODEL
    ===================================================== */

    function initializeModel() {

        if(
            !modelViewer
        ) {

            console.error(
                "#car-model not found."
            );


            return;

        }


        /*
            Grab existing HTML source before
            removing it.

            This prevents model-viewer from
            loading before our listeners exist.
        */

        const htmlSource =
            modelViewer.dataset.modelSrc ||
            modelViewer.getAttribute(
                "src"
            );


        if(
            modelViewer.hasAttribute(
                "src"
            )
        ) {

            modelViewer.removeAttribute(
                "src"
            );

        }


        modelViewer.style.display =
            "block";


        modelViewer.style.width =
            "100%";


        modelViewer.style.height =
            "100%";


        modelViewer.orientation =
            MODEL_ORIENTATION;


        modelViewer.addEventListener(

            "load",

            handleModelLoaded

        );


        modelViewer.addEventListener(

            "error",

            handleModelError

        );


        /*
            Put HTML's preferred filename
            at the top of candidate list.
        */

        if(
            htmlSource
        ) {

            const existingIndex =
                MODEL_CANDIDATES.indexOf(
                    htmlSource
                );


            if(
                existingIndex >
                0
            ) {

                MODEL_CANDIDATES.splice(
                    existingIndex,
                    1
                );


                MODEL_CANDIDATES.unshift(
                    htmlSource
                );

            }
            else if(
                existingIndex ===
                -1
            ) {

                MODEL_CANDIDATES.unshift(
                    htmlSource
                );

            }

        }


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

                        tryModelCandidate(
                            0
                        );

                    }

                )
                .catch(

                    error => {

                        console.error(
                            "model-viewer failed:",
                            error
                        );


                        setPlaceholderStatus(

                            "3D VIEWER FAILED",

                            "The 3D viewer library could not load."

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
            vehicleStory.getBoundingClientRect();


        const travel =
            Math.max(

                1,

                vehicleStory.offsetHeight -
                window.innerHeight

            );


        return clamp(

            -rect.top /
            travel

        );

    }


    /* =====================================================
       TARGET POINT ALONG VEHICLE
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

            0.33;


        return target;

    }


    /* =====================================================
       CAMERA STORY
    ===================================================== */

    function cameraState(
        progress
    ) {

        /*
            FULL VEHICLE

            Very far back so the entire
            solar car is visible.
        */

        const fullIntro = {

            orbit:
                90,

            phi:
                71,

            radius:
                FULL_VIEW_DISTANCE,

            target:
                modelTarget(
                    0
                )

        };


        /*
            FRONT / SOLAR ARRAY
        */

        const solarDetail = {

            orbit:
                76,

            phi:
                66,

            radius:
                56,

            target:
                modelTarget(
                    0.68
                )

        };


        /*
            CENTER / DRIVER / ELECTRONICS

            Closest camera position.
        */

        const centerDetail = {

            orbit:
                96,

            phi:
                62,

            radius:
                43,

            target:
                modelTarget(
                    0.04
                )

        };


        /*
            REAR / DRIVETRAIN
        */

        const rearDetail = {

            orbit:
                115,

            phi:
                67,

            radius:
                52,

            target:
                modelTarget(
                    -0.66
                )

        };


        /*
            FINAL FULL VEHICLE
        */

        const fullEnd = {

            orbit:
                98,

            phi:
                72,

            radius:
                FULL_VIEW_DISTANCE,

            target:
                modelTarget(
                    0
                )

        };


        /* =================================================
           0 → 20%
           FULL VEHICLE
        ================================================= */

        if(
            progress <
            0.20
        ) {

            const t =
                smoothstep(

                    progress /
                    0.20

                );


            return {

                orbit:
                    lerp(
                        84,
                        fullIntro.orbit,
                        t
                    ),

                phi:
                    lerp(
                        74,
                        fullIntro.phi,
                        t
                    ),

                radius:
                    lerp(
                        165,
                        fullIntro.radius,
                        t
                    ),

                target:
                    fullIntro.target

            };

        }


        /* =================================================
           20 → 40%
           FULL → SOLAR
        ================================================= */

        if(
            progress <
            0.40
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.20
                    ) /
                    0.20

                );


            return {

                orbit:
                    lerp(
                        fullIntro.orbit,
                        solarDetail.orbit,
                        t
                    ),

                phi:
                    lerp(
                        fullIntro.phi,
                        solarDetail.phi,
                        t
                    ),

                radius:
                    lerp(
                        fullIntro.radius,
                        solarDetail.radius,
                        t
                    ),

                target:
                    mixTarget(
                        fullIntro.target,
                        solarDetail.target,
                        t
                    )

            };

        }


        /* =================================================
           40 → 60%
           SOLAR → DRIVER / CONTROL
        ================================================= */

        if(
            progress <
            0.60
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.40
                    ) /
                    0.20

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


        /* =================================================
           60 → 80%
           CENTER → DRIVETRAIN
        ================================================= */

        if(
            progress <
            0.80
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        0.60
                    ) /
                    0.20

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


        /* =================================================
           80 → 100%
           DRIVETRAIN → FULL VEHICLE
        ================================================= */

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
       MODEL STORY TEXT
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
                        story.dataset.start
                    );


                const end =
                    Number(
                        story.dataset.end
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
       UPDATE MODEL
    ===================================================== */

    function updateModel() {

        if(
            !vehicleStory
        ) {

            return;

        }


        const progress =
            modelProgress();


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


        /* =================================================
           ORBIT READOUT
        ================================================= */

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


        /* =================================================
           VIEW NAME
        ================================================= */

        if(
            viewReadout
        ) {

            if(
                progress <
                0.20
            ) {

                viewReadout.textContent =
                    "FULL VEHICLE";

            }
            else if(
                progress <
                0.40
            ) {

                viewReadout.textContent =
                    "SOLAR / FRONT";

            }
            else if(
                progress <
                0.60
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
                        chapter.getBoundingClientRect();


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
       ACTIVE NAV
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
                        item.element.id;

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
       RENDER
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
       INITIALIZE
    ===================================================== */

    function initialize() {

        if(
            initialized
        ) {

            return;

        }


        initialized =
            true;


        initializeModel();


        measure();


        revealPageOnce();


        schedule();

    }


    /*
        Because script.js is loaded with
        defer, the DOM already exists here.
    */

    initialize();


    /*
        Browser Back / Forward cache.

        Do NOT replay the logo flicker.
    */

    window.addEventListener(

        "pageshow",

        event => {

            if(
                event.persisted
            ) {

                if(
                    transition
                ) {

                    transition.className =
                        "page-transition is-revealed";

                }


                measure();


                schedule();

            }

        }

    );

})();
