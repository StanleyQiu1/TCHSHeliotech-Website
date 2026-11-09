(() => {

    "use strict";


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


    const smoothstep = t => {

        t = clamp(t);

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
        matchMedia(
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


    /* =====================================================
       MODEL STATE
    ===================================================== */

    let modelLoaded =
        false;


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
        Automatically detected longest
        direction of the vehicle.
    */

    let modelLongAxis =
        "z";


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
       PAGE ENTRY
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


        /*
            Start with page covered.

            Logo flickers while visible,
            then diagonal transition
            slides away.
        */

        transition.className =
            "page-transition";


        transitionTimer =
            setTimeout(

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
       PAGE TRANSITION
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


        /*
            Position transition on
            right side of viewport.
        */

        transition.className =
            "page-transition is-preparing";


        requestAnimationFrame(

            () => {

                requestAnimationFrame(

                    () => {

                        /*
                            Slanted transition
                            sweeps onto screen.
                        */

                        transition.className =
                            "page-transition is-covering";


                        /*
                            Navigate after screen
                            is fully covered.
                        */

                        setTimeout(

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
       INTERCEPT SAME-SITE LINKS
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


            /*
                Preserve normal behavior
                for new-tab shortcuts.
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
                External websites should
                open normally.
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


                        setTimeout(

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

                threshold: .18,

                rootMargin:
                    "0px 0px -8% 0px"

            }

        );


    flickerElements.forEach(

        (
            element,
            index
        ) => {

            /*
                Slightly stagger flicker
                so everything doesn't
                flicker simultaneously.
            */

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
       MODEL LOAD
    ===================================================== */

    if(
        modelViewer &&
        vehicleStory
    ) {

        modelViewer.addEventListener(

            "load",

            () => {

                modelLoaded =
                    true;


                /*
                    Get actual geometry bounds
                    directly from the GLB.
                */

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


                /*
                    Determine which model axis
                    represents the length of
                    the solar car.
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


                /*
                    Recalculate the camera
                    after HTML orientation
                    has been applied.
                */

                if(
                    typeof modelViewer
                        .updateFraming ===
                    "function"
                ) {

                    modelViewer
                        .updateFraming();

                }


                vehicleStory
                    .classList
                    .add(
                        "model-loaded"
                    );


                if(
                    modelPlaceholder
                ) {

                    modelPlaceholder
                        .setAttribute(
                            "aria-hidden",
                            "true"
                        );

                }


                /*
                    Immediately put model
                    into correct scroll state.
                */

                updateModel();

            }

        );


        modelViewer.addEventListener(

            "error",

            () => {

                modelLoaded =
                    false;


                vehicleStory
                    .classList
                    .remove(
                        "model-loaded"
                    );

            }

        );

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
                innerHeight

            );


        return clamp(

            -rect.top /
            travel

        );

    }


    /* =====================================================
       TARGET POSITION ON CAR
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


        /*
            position:

            -1.0 = one end
             0.0 = center
            +1.0 = opposite end
        */

        target[
            modelLongAxis
        ] +=

            modelSize[
                modelLongAxis
            ] *

            position *

            .34;


        return target;

    }


    /* =====================================================
       CAMERA STORY
    ===================================================== */

    function cameraState(
        progress
    ) {

        /*
            FULL CAR
        */

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


        /*
            FRONT / SOLAR DETAIL
        */

        const solarDetail = {

            orbit:
                75,

            phi:
                67,

            radius:
                64,

            target:
                modelTarget(
                    .70
                )

        };


        /*
            CENTER / ELECTRONICS
            / DRIVER AREA
        */

        const centerDetail = {

            orbit:
                100,

            phi:
                63,

            radius:
                53,

            target:
                modelTarget(
                    .06
                )

        };


        /*
            REAR / DRIVETRAIN
        */

        const rearDetail = {

            orbit:
                118,

            phi:
                69,

            radius:
                61,

            target:
                modelTarget(
                    -.68
                )

        };


        /*
            FINAL FULL CAR
        */

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


        /* =============================================
           FULL VEHICLE INTRO
        ============================================= */

        if(
            progress <
            .17
        ) {

            const t =
                smoothstep(
                    progress /
                    .17
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
                        120,
                        fullStart.radius,
                        t
                    ),

                target:
                    fullStart.target

            };

        }


        /* =============================================
           ZOOM TOWARD SOLAR / FRONT
        ============================================= */

        if(
            progress <
            .37
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .17
                    ) /
                    .20

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


        /* =============================================
           MOVE TO ELECTRONICS / DRIVER
        ============================================= */

        if(
            progress <
            .59
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .37
                    ) /
                    .22

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


        /* =============================================
           MOVE TO REAR / DRIVETRAIN
        ============================================= */

        if(
            progress <
            .80
        ) {

            const t =
                smoothstep(

                    (
                        progress -
                        .59
                    ) /
                    .21

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


        /* =============================================
           PULL BACK TO FULL VEHICLE
        ============================================= */

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


        /*
            Small re-trigger when
            moving into new section.
        */

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
       UPDATE 3D MODEL
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
            Story text should still work
            even if model file hasn't
            loaded yet.
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


        /*
            Camera orientation.

            This moves around the car
            instead of simply rotating
            the object like a turntable.
        */

        modelViewer.cameraOrbit =

            `${state.orbit}deg ` +
            `${state.phi}deg ` +
            `${state.radius}%`;


        /*
            Move focus point along
            different sections of car.
        */

        modelViewer.cameraTarget =

            `${state.target.x}m ` +
            `${state.target.y}m ` +
            `${state.target.z}m`;


        /* =============================================
           UI READOUT
        ============================================= */

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
                .17
            ) {

                viewReadout.textContent =
                    "FULL VEHICLE";

            }
            else if(
                progress <
                .37
            ) {

                viewReadout.textContent =
                    "SOLAR / FRONT";

            }
            else if(
                progress <
                .59
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
                innerHeight

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
                            scrollY

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
                    scrollY +
                    innerHeight *
                    .38 >=
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
       MAIN RENDER LOOP
    ===================================================== */

    function render() {

        frame =
            0;


        const pageProgress =
            clamp(
                scrollY /
                maxScroll
            );


        if(
            progressBar
        ) {

            progressBar.style
                .transform =
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
       EVENTS
    ===================================================== */

    window.addEventListener(

        "scroll",

        schedule,

        {
            passive: true
        }

    );


    let resizeTimer =
        0;


    window.addEventListener(

        "resize",

        () => {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(

                    () => {

                        measure();

                        updateModel();

                    },

                    120

                );

        }

    );


    /*
        Handles normal navigation
        and browser Back/Forward.
    */

    window.addEventListener(

        "pageshow",

        () => {

            measure();

            revealPage();

            schedule();

        }

    );


    /*
        Fallback if document was
        already loaded before the
        script finished.
    */

    if(
        document.readyState ===
        "complete"
    ) {

        measure();

        revealPage();

        schedule();

    }

})();
