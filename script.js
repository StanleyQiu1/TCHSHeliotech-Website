(() => {

    "use strict";


    /* =====================================================
       SETTINGS
    ===================================================== */

    const VEHICLE_SCROLL_HEIGHT =
        "700vh";


    /*
        Current orientation correction.
    */

    const MODEL_ORIENTATION =
        "0deg -90deg 0deg";


    const FULL_VIEW_DISTANCE =
        150;


    const TRANSITION_FLAG =
        "heliotech-transition-incoming";


    /* =====================================================
       MODEL COLOR PALETTE

       These correspond to the 15 materials
       inside your actual Fusion GLB.

       The goal is:
       - nothing near black
       - clear separation between components
       - softer whites
       - brighter green / blue / orange
       - good visibility on black background
    ===================================================== */

    const MODEL_COLORS = [

        /* 0  structural gray */
        "#aebbc4",

        /* 1  light blue */
        "#75c9ee",

        /* 2  orange */
        "#ff9f43",

        /* 3  main white / shell */
        "#d7e0e6",

        /* 4  secondary gray */
        "#98a7b1",

        /* 5  pale blue / lavender */
        "#a5b8f3",

        /* 6  default neutral */
        "#c2cdd4",

        /* 7  darker gray, but NOT black */
        "#758690",

        /* 8  warm gray */
        "#bbb6ae",

        /* 9  blue */
        "#527fe5",

        /* 10 yellow / amber */
        "#ffc44c",

        /* 11 pale cyan */
        "#a9def4",

        /* 12 green */
        "#68c978",

        /* 13 deep blue */
        "#6677df",

        /* 14 fallback */
        "#b7c4cc"

    ];


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
       MODEL FILE FALLBACKS
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
       LONG 3D SCROLL
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
       INCOMING TRANSITION
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
       PAGE ENTRY
    ===================================================== */

    function revealPageOnce() {

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


        transition.className =
            "page-transition is-entering";


        transitionTimer =
            window.setTimeout(

                () => {

                    transition.className =
                        "page-transition is-revealed";

                },

                760

            );

    }


    /* =====================================================
       PAGE EXIT
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

                            950

                        );

                    }

                );

            }

        );

    }


    /* =====================================================
       INTERNAL LINK TRANSITION
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


                        flickerObserver.unobserve(
                            element
                        );

                    }

                );

            },

            {

                threshold:
                    .18,

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
       PLACEHOLDER
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
       MODEL MATERIAL COLORS
    ===================================================== */

    function applyModelMaterialFixes() {

        if(
            !modelViewer ||
            !modelViewer.model ||
            !modelViewer.model.materials
        ) {

            return;

        }


        const materials =
            modelViewer.model.materials;


        console.log(
            "Applying HelioTech color palette to",
            materials.length,
            "materials"
        );


        materials.forEach(

            (
                material,
                index
            ) => {

                try {

                    /*
                        Prevent thin Fusion surfaces
                        from disappearing when seen
                        from the opposite side.
                    */

                    if(
                        typeof material.setDoubleSided ===
                        "function"
                    ) {

                        material.setDoubleSided(
                            true
                        );

                    }


                    const pbr =
                        material.pbrMetallicRoughness;


                    if(
                        !pbr
                    ) {

                        return;

                    }


                    /*
                        Assign a bright color from
                        the actual GLB material index.
                    */

                    const color =
                        MODEL_COLORS[
                            index
                        ] ||
                        "#b9c5cd";


                    pbr.setBaseColorFactor(
                        color
                    );


                    /*
                        Fusion CAD materials can become
                        very dark because of metallic
                        reflections.

                        Keep everything mostly matte.
                    */

                    pbr.setMetallicFactor(
                        .03
                    );


                    pbr.setRoughnessFactor(
                        .78
                    );


                    /*
                        Make sure transparent / unusual
                        material modes do not make parts
                        unexpectedly disappear.
                    */

                    if(
                        typeof material.setAlphaMode ===
                        "function"
                    ) {

                        material.setAlphaMode(
                            "OPAQUE"
                        );

                    }


                    console.log(
                        `Material ${index}:`,
                        material.name,
                        "→",
                        color
                    );

                }
                catch(
                    error
                ) {

                    console.warn(
                        "Material color update failed:",
                        index,
                        material?.name,
                        error
                    );

                }

            }

        );


        /*
            Neutral grayscale lighting.
        */

        modelViewer.environmentImage =
            "neutral";


        /*
            Neutral PBR tone mapping gives
            better color separation.
        */

        modelViewer.setAttribute(
            "tone-mapping",
            "neutral"
        );


        /*
            Moderate exposure.

            The previous 1.35 could wash out
            the white body.

            1.18 keeps white, green and blue
            visibly separated.
        */

        modelViewer.exposure =
            1.18;


        modelViewer.shadowIntensity =
            0;

    }


    /* =====================================================
       TRY MODEL
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
                Apply colors immediately.
            */

            applyModelMaterialFixes();


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
                "Unable to prepare model.",
                error
            );

        }


        /*
            Apply materials once more on
            the next rendered frame.

            This prevents the viewer from
            restoring any original material
            state during its final load pass.
        */

        requestAnimationFrame(

            () => {

                try {

                    applyModelMaterialFixes();


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


        modelViewer.environmentImage =
            "neutral";


        modelViewer.setAttribute(
            "tone-mapping",
            "neutral"
        );


        modelViewer.exposure =
            1.18;


        modelViewer.shadowIntensity =
            0;


        modelViewer.addEventListener(

            "load",

            handleModelLoaded

        );


        modelViewer.addEventListener(

            "error",

            handleModelError

        );


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
       MODEL TARGET
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

            .33;


        return target;

    }


    /* =====================================================
       CAMERA STORY
    ===================================================== */

    function cameraState(
        progress
    ) {

        const fullIntro = {

            orbit: 90,

            phi: 71,

            radius:
                FULL_VIEW_DISTANCE,

            target:
                modelTarget(
                    0
                )

        };


        const solarDetail = {

            orbit: 76,

            phi: 66,

            radius: 56,

            target:
                modelTarget(
                    .68
                )

        };


        const centerDetail = {

            orbit: 96,

            phi: 62,

            radius: 43,

            target:
                modelTarget(
                    .04
                )

        };


        const rearDetail = {

            orbit: 115,

            phi: 67,

            radius: 52,

            target:
                modelTarget(
                    -.66
                )

        };


        const fullEnd = {

            orbit: 98,

            phi: 72,

            radius:
                FULL_VIEW_DISTANCE,

            target:
                modelTarget(
                    0
                )

        };


        /* =================================================
           FULL VEHICLE
        ================================================= */

        if(
            progress <
            .20
        ) {

            const t =
                smoothstep(
                    progress /
                    .20
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
           SOLAR / FRONT
        ================================================= */

        if(
            progress <
            .40
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .20
                    ) /
                    .20

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
           CONTROL / DRIVER
        ================================================= */

        if(
            progress <
            .60
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .40
                    ) /
                    .20

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
           DRIVETRAIN
        ================================================= */

        if(
            progress <
            .80
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .60
                    ) /
                    .20

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
           FINAL FULL VEHICLE
        ================================================= */

        const t =
            smoothstep(

                (
                    progress -
                    .80
                ) /
                .20

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
           ANGLE
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
           VIEW LABEL
        ================================================= */

        if(
            viewReadout
        ) {

            if(
                progress <
                .20
            ) {

                viewReadout.textContent =
                    "FULL VEHICLE";

            }
            else if(
                progress <
                .40
            ) {

                viewReadout.textContent =
                    "SOLAR / FRONT";

            }
            else if(
                progress <
                .60
            ) {

                viewReadout.textContent =
                    "CONTROL / DRIVER";

            }
            else if(
                progress <
                .80
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
       ACTIVE NAVIGATION
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
                    .38 >=
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


    initialize();


    /* =====================================================
       BACK / FORWARD CACHE
    ===================================================== */

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
