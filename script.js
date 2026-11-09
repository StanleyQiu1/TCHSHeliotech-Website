(() => {

    "use strict";


    /* =====================================================
       HELPERS
    ===================================================== */

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


    const smooth =
        value =>
        value *
        value *
        (
            3 -
            2 *
            value
        );


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


    let frame =
        0;


    let maxScroll =
        1;


    let chapterData =
        [];


    let lastActiveStory =
        null;


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
       PAGE TRANSITION — INITIAL REVEAL
    ===================================================== */

    function revealPage() {

        if(
            !transition ||
            reducedMotion.matches
        ) {

            return;

        }


        /*
            Start with screen covered.
            Then slide the transition
            screen away to the left.
        */

        setTimeout(

            () => {

                transition
                .classList
                .add(
                    "is-revealed"
                );

            },

            180

        );

    }


    /* =====================================================
       PAGE TRANSITION — LINK CLICK
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
            Move transition layer
            instantly to right side.
        */

        transition.className =
            "page-transition is-preparing";


        /*
            Browser needs two frames
            so it registers the starting
            transform before animating.
        */

        requestAnimationFrame(

            () => {

                requestAnimationFrame(

                    () => {

                        transition.className =
                            "page-transition is-covering";


                        setTimeout(

                            () => {

                                window.location.href =
                                    href;

                            },

                            850

                        );

                    }

                );

            }

        );

    }


    /*
        Animate navigation for internal
        page links.

        Hash links stay normal because
        they only move around this page.
    */

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
                Do not intercept Ctrl-click,
                Cmd-click, Shift-click, etc.
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
                Only animate links staying
                on the same website.
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


    /*
        Important for browser Back button.
    */

    window.addEventListener(

        "pageshow",

        () => {

            if(
                !transition
            ) {

                return;

            }


            transition.className =
                "page-transition";


            revealPage();

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
       MODEL LOADING
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
       STORY TEXT
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
                        progress >= start &&
                        progress <= end;


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
            Flicker each story once
            when it becomes active.
        */

        if(
            current &&
            current !==
            lastActiveStory
        ) {


            current.classList
                .remove(
                    "story-flicker"
                );


            void current.offsetWidth;


            current.classList
                .add(
                    "story-flicker"
                );


            lastActiveStory =
                current;

        }

    }


    /* =====================================================
       MODEL CAMERA
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
            About one complete turn,
            but not perfectly flat.
        */

        const theta =
            -42 +
            progress *
            340;


        /*
            Camera rises slightly toward
            the middle of the sequence.
        */

        const phi =
            72 -
            Math.sin(
                progress *
                Math.PI
            ) *
            8;


        /*
            Small zoom-in at the center.
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
       ACTIVE NAV
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


    window.addEventListener(

        "load",

        () => {

            measure();

            revealPage();

        }

    );


    /*
        If script loads after everything
        is already loaded.
    */

    if(
        document.readyState ===
        "complete"
    ) {

        measure();

        revealPage();

    }

})();
