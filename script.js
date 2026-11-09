(() => {

    "use strict";


    const clamp =
        (
            value,
            min = 0,
            max = 1
        ) =>
        Math.max(
            min,
            Math.min(
                max,
                value
            )
        );


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
                    !nav.classList
                    .contains(
                        "open"
                    );


                nav.classList
                .toggle(
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
       PAGE TRANSITION — PAGE ENTRY
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
            Reset to fully covered.

            This lets the HelioTech logo
            flicker briefly before the
            diagonal panels sweep away.
        */

        transition.className =
            "page-transition";


        transitionTimer =
            setTimeout(

                () => {

                    transition.classList
                        .add(
                            "is-revealed"
                        );

                },

                520

            );

    }



    /* =====================================================
       PAGE TRANSITION — PAGE EXIT
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
            Put the diagonal transition
            completely off-screen right.
        */

        transition.className =
            "page-transition is-preparing";


        /*
            Two animation frames ensure
            the browser registers the
            off-screen starting position.
        */

        requestAnimationFrame(

            () => {

                requestAnimationFrame(

                    () => {

                        /*
                            Sweep onto the screen.

                            The logo also performs
                            the small flicker here.
                        */

                        transition.className =
                            "page-transition is-covering";


                        /*
                            Load the new page after
                            the transition has
                            essentially covered
                            the entire viewport.
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
                Preserve normal browser behavior
                for Ctrl-click, Cmd-click,
                Shift-click, etc.
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
                External websites do not
                use our local transition.
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

                threshold:
                    .18,

                rootMargin:
                    "0px 0px -8% 0px"

            }

        );


    flickerElements
        .forEach(

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
       3D MODEL LOAD
    ===================================================== */

    if(
        modelViewer &&
        vehicleStory
    ) {

        modelViewer.addEventListener(

            "load",

            () => {

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

            }

        );


        modelViewer.addEventListener(

            "error",

            () => {

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
       MODEL STORY TEXT
    ===================================================== */

    function updateModelStories(
        progress
    ) {

        let current =
            null;


        modelSteps
            .forEach(

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


                    story.classList
                        .toggle(
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
            When a new 3D story becomes
            active, restart its subtle
            reveal state.
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
       3D CAMERA
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
            Approximately one full
            scroll-driven rotation.
        */

        const theta =
            -42 +
            progress *
            340;


        /*
            Camera moves vertically
            slightly during the turn.
        */

        const phi =
            72 -
            Math.sin(
                progress *
                Math.PI
            ) *
            8;


        /*
            Slight cinematic zoom toward
            the middle of the sequence.
        */

        const radius =
            108 -
            Math.sin(
                progress *
                Math.PI
            ) *
            10;


        if(
            modelViewer
        ) {

            modelViewer.cameraOrbit =
                `${theta}deg ${phi}deg ${radius}%`;

        }


        const normalized =
            (
                (
                    theta %
                    360
                ) +
                360
            ) %
            360;


        if(
            orbitReadout
        ) {

            orbitReadout.textContent =
                `${
                    Math
                        .round(
                            normalized
                        )
                        .toString()
                        .padStart(
                            3,
                            "0"
                        )
                }°`;

        }


        if(
            viewReadout
        ) {

            let view;


            if(
                normalized <
                45 ||
                normalized >=
                315
            ) {

                view =
                    "FRONT";

            }
            else if(
                normalized <
                135
            ) {

                view =
                    "RIGHT SIDE";

            }
            else if(
                normalized <
                225
            ) {

                view =
                    "REAR";

            }
            else {

                view =
                    "LEFT SIDE";

            }


            viewReadout.textContent =
                view;

        }


        updateModelStories(
            progress
        );

    }



    /* =====================================================
       MEASURE PAGE
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


        chapterData
            .forEach(

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
       RENDER
    ===================================================== */

    function render() {

        frame =
            0;


        const progress =
            clamp(
                scrollY /
                maxScroll
            );


        if(
            progressBar
        ) {

            progressBar.style
                .transform =
                    `scaleX(${progress})`;

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
            passive:
                true
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

                    measure,

                    120

                );

        }

    );


    /*
        pageshow works for both:
        - normal navigation
        - browser Back/Forward cache

        This prevents the transition
        from remaining stuck after
        pressing Back.
    */

    window.addEventListener(

        "pageshow",

        () => {

            measure();

            revealPage();

        }

    );


    /*
        Fallback in case script is
        evaluated after pageshow.
    */

    if(
        document.readyState ===
        "complete"
    ) {

        measure();

        revealPage();

    }

})();
