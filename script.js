(() => {

    "use strict";


    /* =====================================================
       HELIOTECH 3D SETTINGS
    ===================================================== */

    /*
        Much longer 3D experience.

        700vh  = previous version
        1100vh = detailed vehicle tour
    */

    const VEHICLE_SCROLL_HEIGHT =
        "1100vh";


    /*
        Current corrected Fusion orientation.
    */

    const MODEL_ORIENTATION =
        "0deg -90deg 0deg";


    /*
        Full vehicle framing.
    */

    const FULL_VIEW_DISTANCE =
        150;


    /*
        Close-up distances.

        Smaller number = closer camera.
    */

    const DETAIL_DISTANCE =
        42;


    const WHEEL_DISTANCE =
        30;


    const EXTREME_CLOSE_DISTANCE =
        27;


    const TRANSITION_FLAG =
        "heliotech-transition-incoming";


    /* =====================================================
       MODEL COLOR PALETTE
    ===================================================== */

    const MODEL_COLORS = [

        "#aebbc4",   // structural gray

        "#75c9ee",   // bright cyan-blue

        "#ff9f43",   // orange

        "#d7e0e6",   // body / shell

        "#98a7b1",   // gray

        "#a5b8f3",   // pale blue

        "#c2cdd4",   // neutral silver

        "#758690",   // darker gray

        "#bbb6ae",   // warm gray

        "#527fe5",   // blue

        "#ffc44c",   // amber

        "#a9def4",   // pale cyan

        "#68c978",   // green

        "#6677df",   // indigo

        "#b7c4cc"    // fallback

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


    /*
        Automatically detected axes.
    */

    let modelLongAxis =
        "z";


    let modelWidthAxis =
        "x";


    let modelHeightAxis =
        "y";


    /*
        Camera sequence generated
        after model dimensions load.
    */

    let cameraTour =
        [];


    /* =====================================================
       MODEL FILES
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
       LONG VEHICLE SCROLL
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
       PAGE TRANSITION
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
                error
            );

        }


        return false;

    }


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
       INTERNAL LINKS
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

                                element.classList.add(
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
       MODEL MATERIALS
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


        materials.forEach(

            (
                material,
                index
            ) => {

                try {

                    /*
                        Make Fusion surfaces visible
                        from either side.
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


                    const color =
                        MODEL_COLORS[
                            index
                        ] ||
                        "#b9c5cd";


                    pbr.setBaseColorFactor(
                        color
                    );


                    /*
                        Matte CAD look.
                    */

                    pbr.setMetallicFactor(
                        .03
                    );


                    pbr.setRoughnessFactor(
                        .78
                    );


                    if(
                        typeof material.setAlphaMode ===
                        "function"
                    ) {

                        material.setAlphaMode(
                            "OPAQUE"
                        );

                    }

                }
                catch(
                    error
                ) {

                    console.warn(
                        "Material error:",
                        index,
                        error
                    );

                }

            }

        );


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
                "No GLB model found."
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

                "Make sure the GLB is inside the models folder."

            );


            return;

        }


        currentModelCandidate =
            index;


        modelLoaded =
            false;


        modelViewer.style.opacity =
            "0";


        const src =
            MODEL_CANDIDATES[
                index
            ];


        setPlaceholderStatus(

            "LOADING 3D MODEL",

            "Loading HelioTech vehicle..."

        );


        modelViewer.src =
            src;

    }


    /* =====================================================
       MODEL AXES
    ===================================================== */

    function detectModelAxes() {

        const dimensions = [

            {
                axis:
                    "x",

                size:
                    modelSize.x
            },

            {
                axis:
                    "y",

                size:
                    modelSize.y
            },

            {
                axis:
                    "z",

                size:
                    modelSize.z
            }

        ];


        /*
            Largest = vehicle length

            Middle = vehicle width

            Smallest = vehicle height
        */

        dimensions.sort(

            (
                a,
                b
            ) =>

                b.size -
                a.size

        );


        modelLongAxis =
            dimensions[0].axis;


        modelWidthAxis =
            dimensions[1].axis;


        modelHeightAxis =
            dimensions[2].axis;


        console.log(
            "Vehicle axes:",
            {
                long:
                    modelLongAxis,

                width:
                    modelWidthAxis,

                height:
                    modelHeightAxis
            }
        );

    }


    /* =====================================================
       TARGET ANY PART OF CAR

       longPosition:
       -1 rear
        0 center
       +1 front

       widthPosition:
       -1 left
       +1 right

       heightPosition:
       -1 bottom
       +1 top
    ===================================================== */

    function modelTarget(
        longPosition = 0,
        widthPosition = 0,
        heightPosition = 0
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

            longPosition *

            .40;


        target[
            modelWidthAxis
        ] +=

            modelSize[
                modelWidthAxis
            ] *

            widthPosition *

            .40;


        target[
            modelHeightAxis
        ] +=

            modelSize[
                modelHeightAxis
            ] *

            heightPosition *

            .32;


        return target;

    }


    /* =====================================================
       BUILD COMPLETE CAMERA TOUR
    ===================================================== */

    function buildCameraTour() {

        cameraTour = [


            /* =========================================
               FULL FRONT
            ========================================= */

            {
                p:
                    0.00,

                orbit:
                    0,

                phi:
                    72,

                radius:
                    165,

                target:
                    modelTarget(
                        0,
                        0,
                        0
                    ),

                label:
                    "FULL VEHICLE / FRONT"
            },


            {
                p:
                    .055,

                orbit:
                    18,

                phi:
                    70,

                radius:
                    145,

                target:
                    modelTarget(
                        0,
                        0,
                        0
                    ),

                label:
                    "FULL VEHICLE"
            },


            /* =========================================
               FRONT CLOSE-UP
            ========================================= */

            {
                p:
                    .11,

                orbit:
                    30,

                phi:
                    69,

                radius:
                    58,

                target:
                    modelTarget(
                        .67,
                        0,
                        0
                    ),

                label:
                    "FRONT"
            },


            /* =========================================
               FRONT LEFT
            ========================================= */

            {
                p:
                    .17,

                orbit:
                    48,

                phi:
                    70,

                radius:
                    DETAIL_DISTANCE,

                target:
                    modelTarget(
                        .60,
                        -.20,
                        0
                    ),

                label:
                    "FRONT / LEFT"
            },


            /* =========================================
               FRONT LEFT WHEEL
            ========================================= */

            {
                p:
                    .23,

                orbit:
                    70,

                phi:
                    78,

                radius:
                    WHEEL_DISTANCE,

                target:
                    modelTarget(
                        .58,
                        -.42,
                        -.18
                    ),

                label:
                    "FRONT WHEEL / LEFT"
            },


            /* =========================================
               LEFT SIDE
            ========================================= */

            {
                p:
                    .29,

                orbit:
                    90,

                phi:
                    70,

                radius:
                    54,

                target:
                    modelTarget(
                        .10,
                        -.16,
                        0
                    ),

                label:
                    "LEFT SIDE"
            },


            /* =========================================
               DRIVER / COCKPIT
            ========================================= */

            {
                p:
                    .35,

                orbit:
                    110,

                phi:
                    60,

                radius:
                    EXTREME_CLOSE_DISTANCE,

                target:
                    modelTarget(
                        .08,
                        -.05,
                        .12
                    ),

                label:
                    "DRIVER / COCKPIT"
            },


            /* =========================================
               ELECTRONICS / CENTER
            ========================================= */

            {
                p:
                    .41,

                orbit:
                    132,

                phi:
                    66,

                radius:
                    31,

                target:
                    modelTarget(
                        -.06,
                        0,
                        .04
                    ),

                label:
                    "ELECTRONICS / CENTER"
            },


            /* =========================================
               REAR LEFT WHEEL
            ========================================= */

            {
                p:
                    .47,

                orbit:
                    150,

                phi:
                    78,

                radius:
                    WHEEL_DISTANCE,

                target:
                    modelTarget(
                        -.60,
                        -.42,
                        -.18
                    ),

                label:
                    "REAR WHEEL / LEFT"
            },


            /* =========================================
               REAR
            ========================================= */

            {
                p:
                    .53,

                orbit:
                    180,

                phi:
                    70,

                radius:
                    61,

                target:
                    modelTarget(
                        -.68,
                        0,
                        0
                    ),

                label:
                    "REAR"
            },


            /* =========================================
               REAR RIGHT WHEEL
            ========================================= */

            {
                p:
                    .59,

                orbit:
                    215,

                phi:
                    78,

                radius:
                    WHEEL_DISTANCE,

                target:
                    modelTarget(
                        -.60,
                        .42,
                        -.18
                    ),

                label:
                    "REAR WHEEL / RIGHT"
            },


            /* =========================================
               RIGHT SIDE
            ========================================= */

            {
                p:
                    .65,

                orbit:
                    270,

                phi:
                    70,

                radius:
                    53,

                target:
                    modelTarget(
                        0,
                        .16,
                        0
                    ),

                label:
                    "RIGHT SIDE"
            },


            /* =========================================
               FRONT RIGHT WHEEL
            ========================================= */

            {
                p:
                    .71,

                orbit:
                    300,

                phi:
                    78,

                radius:
                    WHEEL_DISTANCE,

                target:
                    modelTarget(
                        .58,
                        .42,
                        -.18
                    ),

                label:
                    "FRONT WHEEL / RIGHT"
            },


            /* =========================================
               FRONT RIGHT
            ========================================= */

            {
                p:
                    .77,

                orbit:
                    330,

                phi:
                    67,

                radius:
                    DETAIL_DISTANCE,

                target:
                    modelTarget(
                        .50,
                        .20,
                        0
                    ),

                label:
                    "FRONT / RIGHT"
            },


            /* =========================================
               TOP DOWN
            ========================================= */

            {
                p:
                    .83,

                orbit:
                    360,

                phi:
                    22,

                radius:
                    75,

                target:
                    modelTarget(
                        0,
                        0,
                        .05
                    ),

                label:
                    "TOP VIEW"
            },


            /* =========================================
               SOLAR ARRAY TOP CLOSE-UP
            ========================================= */

            {
                p:
                    .88,

                orbit:
                    390,

                phi:
                    29,

                radius:
                    38,

                target:
                    modelTarget(
                        .15,
                        0,
                        .24
                    ),

                label:
                    "SOLAR ARRAY / TOP"
            },


            /* =========================================
               LOW ANGLE / UNDERCARRIAGE
            ========================================= */

            {
                p:
                    .93,

                orbit:
                    420,

                phi:
                    108,

                radius:
                    45,

                target:
                    modelTarget(
                        0,
                        0,
                        -.22
                    ),

                label:
                    "LOW ANGLE / CHASSIS"
            },


            /* =========================================
               FULL VEHICLE
            ========================================= */

            {
                p:
                    .97,

                orbit:
                    450,

                phi:
                    72,

                radius:
                    145,

                target:
                    modelTarget(
                        0,
                        0,
                        0
                    ),

                label:
                    "FULL VEHICLE"
            },


            /* =========================================
               FINAL FULL VIEW
            ========================================= */

            {
                p:
                    1.00,

                orbit:
                    500,

                phi:
                    68,

                radius:
                    155,

                target:
                    modelTarget(
                        0,
                        0,
                        0
                    ),

                label:
                    "FULL VEHICLE / COMPLETE"
            }

        ];

    }


    /* =====================================================
       INTERPOLATE CAMERA TOUR
    ===================================================== */

    function cameraState(
        progress
    ) {

        if(
            cameraTour.length <
            2
        ) {

            return {

                orbit:
                    0,

                phi:
                    72,

                radius:
                    FULL_VIEW_DISTANCE,

                target:
                    modelCenter,

                label:
                    "FULL VEHICLE"

            };

        }


        if(
            progress <=
            cameraTour[0].p
        ) {

            return cameraTour[0];

        }


        if(
            progress >=
            cameraTour[
                cameraTour.length -
                1
            ].p
        ) {

            return cameraTour[
                cameraTour.length -
                1
            ];

        }


        for(
            let i = 0;
            i <
            cameraTour.length -
            1;
            i++
        ) {

            const start =
                cameraTour[
                    i
                ];


            const end =
                cameraTour[
                    i +
                    1
                ];


            if(
                progress >=
                start.p &&
                progress <=
                end.p
            ) {

                const rawT =

                    (
                        progress -
                        start.p
                    ) /

                    (
                        end.p -
                        start.p
                    );


                const t =
                    smoothstep(
                        rawT
                    );


                return {

                    orbit:
                        lerp(
                            start.orbit,
                            end.orbit,
                            t
                        ),

                    phi:
                        lerp(
                            start.phi,
                            end.phi,
                            t
                        ),

                    radius:
                        lerp(
                            start.radius,
                            end.radius,
                            t
                        ),

                    target:
                        mixTarget(
                            start.target,
                            end.target,
                            t
                        ),

                    label:

                        rawT <
                        .50

                        ? start.label
                        : end.label

                };

            }

        }


        return cameraTour[
            cameraTour.length -
            1
        ];

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


            detectModelAxes();


            /*
                Build the full 360°
                inspection sequence.
            */

            buildCameraTour();


            console.log(
                "Model center:",
                modelCenter
            );


            console.log(
                "Model dimensions:",
                modelSize
            );


            console.log(
                "Camera tour:",
                cameraTour
            );

        }
        catch(
            error
        ) {

            console.warn(
                "Unable to prepare model:",
                error
            );

        }


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

                vehicleStory.offsetHeight -
                window.innerHeight

            );


        return clamp(

            -rect.top /
            travel

        );

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


        /*
            Camera angle.
        */

        modelViewer.cameraOrbit =

            `${state.orbit}deg ` +
            `${state.phi}deg ` +
            `${state.radius}%`;


        /*
            Camera target.

            This is what allows us to
            zoom onto wheels, cockpit,
            solar array, chassis, etc.
        */

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
           CURRENT POV
        ================================================= */

        if(
            viewReadout
        ) {

            viewReadout.textContent =
                state.label;

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
