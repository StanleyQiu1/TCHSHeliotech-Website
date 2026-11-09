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


    const modelSection =
        document.querySelector(
            ".model-scroll"
        );


    const modelStage =
        document.querySelector(
            "#model-stage"
        );


    const modelViewer =
        document.querySelector(
            "#car-model"
        );


    const rotationValue =
        document.querySelector(
            "#rotation-value"
        );


    const viewValue =
        document.querySelector(
            "#view-value"
        );


    let frame =
        0;


    let maxScroll =
        1;


    let chapterData =
        [];


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function closeMenu() {

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


    /* =====================================================
       FLICKER
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

            /*
               Slight stagger prevents every
               block flickering at exactly
               the same instant.
            */

            element.dataset
            .flickerDelay =
                String(
                    (
                        index %
                        4
                    ) *
                    65
                );


            flickerObserver
            .observe(
                element
            );

        }

    );


    /* =====================================================
       MODEL
    ===================================================== */

    if(
        modelViewer &&
        modelStage
    ) {

        modelViewer.addEventListener(

            "load",

            () => {

                modelStage.classList
                .add(
                    "model-loaded"
                );

            }

        );


        modelViewer.addEventListener(

            "error",

            () => {

                modelStage.classList
                .remove(
                    "model-loaded"
                );

            }

        );

    }


    function getModelProgress() {

        if(
            !modelSection
        ) {

            return 0;

        }


        const rect =
            modelSection
            .getBoundingClientRect();


        const travel =
            Math.max(

                1,

                modelSection
                .offsetHeight -
                innerHeight

            );


        return clamp(
            -rect.top /
            travel
        );

    }


    function updateModel() {

        if(
            !modelViewer ||
            !modelSection
        ) {

            return;

        }


        const progress =
            getModelProgress();


        /*
           The model starts from a slight
           front-left angle and rotates
           almost a complete turn while
           the section is scrolled.
        */

        const theta =
            -42 +
            progress *
            300;


        /*
           Slight vertical camera change
           makes the orbit feel more
           cinematic than a flat turntable.
        */

        const phi =
            73 -
            Math.sin(
                progress *
                Math.PI
            ) *
            7;


        const radius =
            108 -
            Math.sin(
                progress *
                Math.PI
            ) *
            8;


        modelViewer.cameraOrbit =
            `${theta}deg ${phi}deg ${radius}%`;


        const normalizedAngle =
            (
                (
                    theta %
                    360
                ) +
                360
            ) %
            360;


        if(
            rotationValue
        ) {

            rotationValue.textContent =
                `${Math.round(
                    normalizedAngle
                )
                .toString()
                .padStart(
                    3,
                    "0"
                )}°`;

        }


        if(
            viewValue
        ) {

            let view;


            if(
                normalizedAngle <
                45 ||
                normalizedAngle >=
                315
            ) {

                view =
                    "FRONT";

            }
            else if(
                normalizedAngle <
                135
            ) {

                view =
                    "SIDE";

            }
            else if(
                normalizedAngle <
                225
            ) {

                view =
                    "REAR";

            }
            else {

                view =
                    "SIDE";

            }


            viewValue.textContent =
                view;

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
       NAVIGATION + SCROLL
    ===================================================== */

    function updateNavigation() {

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
                        item.element.id;

                }

            }

        );


        nav.querySelectorAll(
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


    function render() {

        frame =
            0;


        const pageProgress =
            clamp(
                scrollY /
                maxScroll
            );


        progressBar.style
        .transform =
            `scaleX(
                ${pageProgress}
            )`;


        updateNavigation();


        updateModel();

    }


    function schedule() {

        if(
            !frame
        ) {

            frame =
                requestAnimationFrame(
                    render
                );

        }

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

        measure

    );


    measure();


})();
