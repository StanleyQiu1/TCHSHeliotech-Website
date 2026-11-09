(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const AUTO_DURATION =
        48000;


    const AUTO_DELAY =
        700;


    const CURSOR_COLORS = [

        "#61b4e8",
        "#7a91f0",
        "#55c5ad",
        "#a598ef",
        "#6099cb",
        "#65c6de",
        "#8aa8ff"

    ];


    const CURSOR_LABELS = [

        "ELEC",
        "UI",
        "MECH",
        "DATA",
        "AERO",
        "PCB",
        "OPS"

    ];


    const CURSOR_COUNT =
        CURSOR_COLORS.length;


    /* =====================================================
       DOM
    ===================================================== */

    const root =
        document.documentElement;


    const body =
        document.body;


    const layer =
        document.querySelector(
            "#builder-layer"
        );


    const hero =
        document.querySelector(
            ".hero"
        );


    const nav =
        document.querySelector(
            "#navigation"
        );


    const menu =
        document.querySelector(
            ".menu-toggle"
        );


    const progressBar =
        document.querySelector(
            ".scroll-progress"
        );


    const status =
        document.querySelector(
            "#autobuild-status"
        );


    const buildElements = [
        ...document.querySelectorAll(
            "[data-build]"
        )
    ];


    const typeElements = [
        ...document.querySelectorAll(
            "[data-type]"
        )
    ];


    const chapters = [
        ...document.querySelectorAll(
            ".chapter"
        )
    ];


    const reducedMotion =
        matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    const desktop =
        matchMedia(
            "(min-width: 1001px) and (min-height: 650px) and (pointer: fine)"
        );


    /* =====================================================
       STATE
    ===================================================== */

    let builderEnabled =
        false;


    let frame =
        0;


    let width =
        innerWidth;


    let height =
        innerHeight;


    let maxScroll =
        1;


    let heroTravel =
        1;


    let buildItems =
        [];


    let cursorObjects =
        [];


    let typingObjects =
        [];


    let chapterMetrics =
        [];


    let autoplayActive =
        false;


    let autoplayCancelled =
        false;


    let autoplayStart =
        0;


    let autoplayFrame =
        0;


    let lastRender =
        0;


    let imageGhost =
        null;


    let imageBuild =
        null;


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


    const lerp =
        (
            a,
            b,
            t
        ) =>
        a +
        (
            b -
            a
        ) *
        t;


    const smooth =
        value =>
        value *
        value *
        (
            3 -
            2 *
            value
        );


    const smoother =
        value =>
        value *
        value *
        value *
        (
            value *
            (
                value *
                6 -
                15
            ) +
            10
        );


    function docTop(element) {

        const rect =
            element
            .getBoundingClientRect();


        return (
            rect.top +
            scrollY
        );

    }


    /* =====================================================
       TEXT PREPARATION
    ===================================================== */

    function collectTextNodes(element) {

        const walker =
            document.createTreeWalker(

                element,

                NodeFilter.SHOW_TEXT,

                {
                    acceptNode(node) {

                        if(
                            !node.nodeValue ||
                            !node.nodeValue.trim()
                        ) {

                            return NodeFilter
                            .FILTER_REJECT;

                        }


                        return NodeFilter
                        .FILTER_ACCEPT;

                    }
                }

            );


        const nodes =
            [];


        while(
            walker.nextNode()
        ) {

            nodes.push(
                walker.currentNode
            );

        }


        return nodes;

    }


    function prepareTyping() {

        typingObjects =
            [];


        typeElements
        .forEach(

            (
                element,
                elementIndex
            ) => {


                if(
                    element.dataset
                    .typingPrepared ===
                    "yes"
                ) {

                    return;

                }


                element.dataset
                .typingPrepared =
                    "yes";


                const textNodes =
                    collectTextNodes(
                        element
                    );


                const chars =
                    [];


                textNodes
                .forEach(

                    textNode => {


                        const text =
                            textNode.nodeValue;


                        const fragment =
                            document
                            .createDocumentFragment();


                        for(
                            let i = 0;
                            i < text.length;
                            i++
                        ) {

                            const span =
                                document
                                .createElement(
                                    "span"
                                );


                            span.className =
                                "typed-char";


                            span.textContent =
                                text[i];


                            fragment.appendChild(
                                span
                            );


                            chars.push(
                                span
                            );

                        }


                        textNode.parentNode
                        .replaceChild(
                            fragment,
                            textNode
                        );

                    }

                );


                const parentBuild =
                    element.closest(
                        "[data-build]"
                    );


                const cursor =
                    parentBuild

                    ? Number(
                        parentBuild.dataset
                        .cursor ||
                        elementIndex %
                        CURSOR_COUNT
                    )

                    : elementIndex %
                    CURSOR_COUNT;


                typingObjects.push({

                    element,

                    chars,

                    cursor:
                        cursor %
                        CURSOR_COUNT,

                    visibleCount:
                        0,

                    item:
                        null

                });

            }

        );

    }


    /* =====================================================
       CURSORS
    ===================================================== */

    function createCursor(index) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "build-cursor";


        element.style
        .setProperty(
            "--cursor",
            CURSOR_COLORS[index]
        );


        element.innerHTML = `

            <svg viewBox="0 0 22 27">

                <path
                    d="
                        M2 2
                        L19 16.5
                        L12.1 17.2
                        L9.1 24.7
                        Z
                    "
                ></path>

            </svg>

            <span class="cursor-label">
                ${CURSOR_LABELS[index]}
            </span>

            <i class="cursor-click"></i>

        `;


        layer.appendChild(
            element
        );


        const outline =
            document.createElement(
                "div"
            );


        outline.className =
            "build-outline";


        outline.style
        .setProperty(
            "--outline",
            CURSOR_COLORS[index]
        );


        layer.appendChild(
            outline
        );


        const leftSide =
            index %
            2 ===
            0;


        return {

            element,

            outline,

            side:
                leftSide
                ? -1
                : 1,

            x:
                leftSide
                ? -120
                : width + 120,

            y:
                100 +
                index *
                70,

            targetX:
                leftSide
                ? -120
                : width + 120,

            targetY:
                100 +
                index *
                70,

            lastTarget:
                null,

            clickTimeout:
                0

        };

    }


    function createCursors() {

        cursorObjects
        .forEach(

            cursor => {

                cursor.element
                .remove();

                cursor.outline
                .remove();

            }

        );


        cursorObjects =
            [];


        for(
            let i = 0;
            i < CURSOR_COUNT;
            i++
        ) {

            cursorObjects
            .push(
                createCursor(
                    i
                )
            );

        }

    }


    function pulseCursor(cursor) {

        cursor.element
        .classList
        .remove(
            "click"
        );


        clearTimeout(
            cursor.clickTimeout
        );


        requestAnimationFrame(

            () =>
            cursor.element
            .classList
            .add(
                "click"
            )

        );


        cursor.clickTimeout =
            setTimeout(

                () =>
                cursor.element
                .classList
                .remove(
                    "click"
                ),

                500

            );

    }


    /* =====================================================
       BUILD ITEM MEASUREMENT
    ===================================================== */

    function measureBuildItems() {

        width =
            innerWidth;


        height =
            innerHeight;


        maxScroll =
            Math.max(

                1,

                document
                .documentElement
                .scrollHeight -
                height

            );


        heroTravel =
            Math.max(

                1,

                hero
                ? hero.offsetHeight -
                    height
                : height

            );


        buildItems =
            buildElements
            .map(

                (
                    element,
                    index
                ) => {


                    const phase =
                        Number(
                            element
                            .dataset
                            .phase
                        );


                    const cursor =
                        Number(
                            element
                            .dataset
                            .cursor ||
                            index %
                            CURSOR_COUNT
                        ) %
                        CURSOR_COUNT;


                    const kind =
                        element
                        .dataset
                        .build;


                    let at;


                    if(
                        Number.isFinite(
                            phase
                        )
                    ) {

                        at =
                            heroTravel *
                            phase;

                    }
                    else {

                        const top =
                            docTop(
                                element
                            );


                        const chapter =
                            element.closest(
                                ".chapter"
                            );


                        let localOffset =
                            0;


                        if(chapter) {

                            const local =
                                [
                                    ...chapter
                                    .querySelectorAll(
                                        "[data-build]"
                                    )
                                ];


                            const localIndex =
                                local.indexOf(
                                    element
                                );


                            localOffset =
                                Math.min(
                                    220,
                                    localIndex *
                                    46
                                );

                        }


                        at =
                            top -
                            height *
                            .78 +
                            localOffset;

                    }


                    const typing =
                        typingObjects
                        .filter(

                            object =>
                            element ===
                            object.element ||
                            element.contains(
                                object.element
                            )

                        );


                    const charCount =
                        typing.reduce(

                            (
                                total,
                                item
                            ) =>
                            total +
                            item.chars.length,

                            0

                        );


                    let duration;


                    if(
                        kind ===
                        "text"
                    ) {

                        duration =
                            Math.max(
                                260,
                                Math.min(
                                    700,
                                    charCount *
                                    5
                                )
                            );

                    }
                    else if(
                        kind ===
                        "image"
                    ) {

                        duration =
                            420;

                    }
                    else {

                        duration =
                            280;

                    }


                    const item = {

                        element,

                        cursor,

                        kind,

                        at,

                        duration,

                        index,

                        typing,

                        activated:
                            false,

                        progress:
                            0

                    };


                    typing
                    .forEach(

                        object =>
                        object.item =
                            item

                    );


                    return item;

                }

            )
            .sort(

                (
                    a,
                    b
                ) =>
                a.at -
                b.at

            );


        chapterMetrics =
            chapters.map(

                chapter => ({

                    element:
                        chapter,

                    top:
                        docTop(
                            chapter
                        )

                })

            );


        imageBuild =
            buildItems.find(

                item =>
                item.kind ===
                "image"

            );


        prepareImageGhost();


        schedule();

    }


    /* =====================================================
       IMAGE GHOST
    ===================================================== */

    function prepareImageGhost() {

        if(imageGhost) {

            imageGhost.remove();

            imageGhost =
                null;

        }


        if(!imageBuild) {

            return;

        }


        imageGhost =
            document
            .createElement(
                "div"
            );


        imageGhost.className =
            "image-ghost";


        imageGhost.innerHTML =
            imageBuild
            .element
            .innerHTML;


        layer.appendChild(
            imageGhost
        );

    }


    /* =====================================================
       BUILD PROGRESS
    ===================================================== */

    function getBuildProgress(
        item,
        scroll
    ) {

        return smooth(

            clamp(

                (
                    scroll -
                    item.at
                ) /
                item.duration

            )

        );

    }


    function flashBlock(item) {

        item.element
        .classList
        .remove(
            "build-flash"
        );


        void item.element
        .offsetWidth;


        item.element
        .classList
        .add(
            "build-flash"
        );

    }


    function updateTyping(
        object,
        progress
    ) {

        const total =
            object.chars.length;


        const targetCount =
            Math.floor(
                total *
                progress
            );


        if(
            targetCount ===
            object.visibleCount
        ) {

            return;

        }


        if(
            targetCount >
            object.visibleCount
        ) {

            for(
                let i =
                    object.visibleCount;
                i <
                    targetCount;
                i++
            ) {

                const char =
                    object.chars[i];


                char.classList
                .add(
                    "is-visible"
                );


                if(
                    char.textContent
                    .trim()
                ) {

                    char.classList
                    .remove(
                        "char-flash"
                    );


                    void char.offsetWidth;


                    char.classList
                    .add(
                        "char-flash"
                    );

                }

            }

        }
        else {

            for(
                let i =
                    targetCount;
                i <
                    object.visibleCount;
                i++
            ) {

                object.chars[i]
                .classList
                .remove(
                    "is-visible",
                    "char-flash"
                );

            }

        }


        object.visibleCount =
            targetCount;

    }


    function updateBuild(
        scroll
    ) {

        buildItems
        .forEach(

            item => {


                const progress =
                    getBuildProgress(
                        item,
                        scroll
                    );


                item.progress =
                    progress;


                item.element
                .style
                .setProperty(
                    "--b",
                    progress
                    .toFixed(
                        4
                    )
                );


                if(
                    progress >
                    .03 &&
                    !item.activated
                ) {

                    item.activated =
                        true;


                    flashBlock(
                        item
                    );

                }


                if(
                    progress <
                    .01
                ) {

                    item.activated =
                        false;

                }


                item.typing
                .forEach(

                    typing =>
                    updateTyping(
                        typing,
                        progress
                    )

                );

            }

        );

    }


    /* =====================================================
       CARET POSITION
    ===================================================== */

    function caretPoint(
        typing
    ) {

        if(
            typing.visibleCount >
            0
        ) {

            const index =
                Math.min(

                    typing.chars.length -
                    1,

                    typing.visibleCount -
                    1

                );


            const rect =
                typing.chars[
                    index
                ]
                .getBoundingClientRect();


            return {

                x:
                    rect.right +
                    4,

                y:
                    rect.bottom -
                    5

            };

        }


        const rect =
            typing.element
            .getBoundingClientRect();


        return {

            x:
                rect.left +
                4,

            y:
                rect.top +
                Math.min(
                    20,
                    rect.height /
                    2
                )

        };

    }


    /* =====================================================
       SHAPE TRACE POSITION
    ===================================================== */

    function traceRectangle(
        rect,
        progress
    ) {

        const perimeter =
            (
                rect.width +
                rect.height
            ) *
            2;


        let distance =
            perimeter *
            progress;


        if(
            distance <=
            rect.width
        ) {

            return {

                x:
                    rect.left +
                    distance,

                y:
                    rect.top

            };

        }


        distance -=
            rect.width;


        if(
            distance <=
            rect.height
        ) {

            return {

                x:
                    rect.right,

                y:
                    rect.top +
                    distance

            };

        }


        distance -=
            rect.height;


        if(
            distance <=
            rect.width
        ) {

            return {

                x:
                    rect.right -
                    distance,

                y:
                    rect.bottom

            };

        }


        distance -=
            rect.width;


        return {

            x:
                rect.left,

            y:
                rect.bottom -
                distance

        };

    }


    /* =====================================================
       IMAGE INSERT
    ===================================================== */

    function updateImage(
        item
    ) {

        if(
            !imageGhost ||
            !item
        ) {

            return null;

        }


        const progress =
            item.progress;


        const rect =
            item.element
            .getBoundingClientRect();


        if(
            progress <=
            .01 ||
            progress >=
            .98
        ) {

            imageGhost.style
            .opacity =
                "0";


            return null;

        }


        const cursor =
            cursorObjects[
                item.cursor
            ];


        const startX =
            cursor.side <
            0

            ? -220

            : width + 220;


        const startY =
            clamp(

                rect.top -
                120,

                100,

                height -
                260

            );


        const p =
            smoother(
                progress
            );


        const ghostWidth =
            lerp(
                160,
                rect.width,
                p
            );


        const ghostHeight =
            lerp(
                100,
                rect.height,
                p
            );


        const x =
            lerp(
                startX,
                rect.left,
                p
            );


        const y =
            lerp(
                startY,
                rect.top,
                p
            );


        imageGhost.style
        .opacity =
            String(
                1 -
                Math.max(
                    0,
                    (
                        progress -
                        .85
                    ) /
                    .15
                )
            );


        imageGhost.style
        .width =
            `${ghostWidth}px`;


        imageGhost.style
        .height =
            `${ghostHeight}px`;


        imageGhost.style
        .transform =
            `translate3d(
                ${x}px,
                ${y}px,
                0
            )`;


        return {

            x:
                x +
                ghostWidth *
                .88,

            y:
                y +
                ghostHeight *
                .82

        };

    }


    /* =====================================================
       CURSOR TARGET
    ===================================================== */

    function cursorActiveItem(
        cursorIndex
    ) {

        return buildItems
        .find(

            item =>
            item.cursor ===
            cursorIndex &&
            item.progress >
            .01 &&
            item.progress <
            .99

        );

    }


    function nextCursorItem(
        cursorIndex,
        scroll
    ) {

        return buildItems
        .find(

            item =>
            item.cursor ===
            cursorIndex &&
            item.at >
            scroll

        );

    }


    function positionForBuild(
        item
    ) {

        const rect =
            item.element
            .getBoundingClientRect();


        if(
            item.typing.length
        ) {

            const activeTyping =
                item.typing.find(

                    typing =>
                    typing.visibleCount <
                    typing.chars.length

                ) ||
                item.typing[
                    item.typing.length -
                    1
                ];


            return caretPoint(
                activeTyping
            );

        }


        if(
            item.kind ===
            "panel" ||
            item.kind ===
            "button" ||
            item.kind ===
            "rule"
        ) {

            return traceRectangle(
                rect,
                item.progress
            );

        }


        return {

            x:
                rect.left +
                rect.width *
                item.progress,

            y:
                rect.top +
                rect.height *
                .5

        };

    }


    /* =====================================================
       OUTLINE
    ===================================================== */

    function updateOutline(
        cursor,
        item
    ) {

        if(
            !item ||
            item.kind ===
            "text" ||
            item.kind ===
            "image"
        ) {

            cursor.outline
            .style
            .opacity =
                "0";


            return;

        }


        const rect =
            item.element
            .getBoundingClientRect();


        cursor.outline
        .style
        .opacity =
            String(
                clamp(
                    item.progress *
                    1.8
                )
            );


        cursor.outline
        .style
        .width =
            `${rect.width}px`;


        cursor.outline
        .style
        .height =
            `${rect.height}px`;


        cursor.outline
        .style
        .transform =
            `translate3d(
                ${rect.left}px,
                ${rect.top}px,
                0
            )`;

    }


    /* =====================================================
       CURSOR MOVEMENT
    ===================================================== */

    function updateCursors(
        timestamp,
        scroll
    ) {

        const dt =
            lastRender

            ? Math.min(
                50,
                timestamp -
                lastRender
            )

            : 16;


        lastRender =
            timestamp;


        const follow =
            1 -
            Math.exp(
                -dt /
                62
            );


        let imageCursorPoint =
            null;


        if(imageBuild) {

            imageCursorPoint =
                updateImage(
                    imageBuild
                );

        }


        cursorObjects
        .forEach(

            (
                cursor,
                index
            ) => {


                const active =
                    cursorActiveItem(
                        index
                    );


                if(active) {


                    let point;


                    if(
                        active ===
                        imageBuild &&
                        imageCursorPoint
                    ) {

                        point =
                            imageCursorPoint;

                    }
                    else {

                        point =
                            positionForBuild(
                                active
                            );

                    }


                    cursor.targetX =
                        point.x;


                    cursor.targetY =
                        point.y;


                    updateOutline(
                        cursor,
                        active
                    );


                    if(
                        cursor.lastTarget !==
                        active
                    ) {

                        cursor.lastTarget =
                            active;


                        pulseCursor(
                            cursor
                        );

                    }

                }
                else {


                    cursor.outline
                    .style
                    .opacity =
                        "0";


                    const next =
                        nextCursorItem(
                            index,
                            scroll
                        );


                    if(next) {


                        const distance =
                            next.at -
                            scroll;


                        const rect =
                            next.element
                            .getBoundingClientRect();


                        if(
                            distance <
                            520
                        ) {


                            const entry =
                                clamp(
                                    1 -
                                    distance /
                                    520
                                );


                            const sideX =
                                cursor.side <
                                0

                                ? -100

                                : width + 100;


                            cursor.targetX =
                                lerp(

                                    sideX,

                                    rect.left +
                                    rect.width *
                                    .5,

                                    smoother(
                                        entry
                                    )

                                );


                            cursor.targetY =
                                lerp(

                                    clamp(
                                        rect.top +
                                        rect.height *
                                        .5,
                                        80,
                                        height - 60
                                    ),

                                    clamp(
                                        rect.top +
                                        rect.height *
                                        .5,
                                        80,
                                        height - 60
                                    ),

                                    entry

                                );

                        }
                        else {


                            cursor.targetX =
                                cursor.side <
                                0

                                ? -140

                                : width + 140;


                            cursor.targetY =
                                90 +
                                index *
                                (
                                    (
                                        height -
                                        180
                                    ) /
                                    CURSOR_COUNT
                                );

                        }

                    }
                    else {


                        cursor.targetX =
                            cursor.side <
                            0

                            ? width + 160

                            : -160;


                        cursor.targetY =
                            100 +
                            (
                                CURSOR_COUNT -
                                index
                            ) *
                            55;

                    }

                }


                cursor.x +=

                    (
                        cursor.targetX -
                        cursor.x
                    ) *
                    follow;


                cursor.y +=

                    (
                        cursor.targetY -
                        cursor.y
                    ) *
                    follow;


                cursor.element
                .style
                .transform =
                    `translate3d(
                        ${cursor.x}px,
                        ${cursor.y}px,
                        0
                    )`;

            }

        );

    }


    /* =====================================================
       NAV ACTIVE STATE
    ===================================================== */

    function updateNavigation(
        scroll
    ) {

        let active =
            "home";


        chapterMetrics
        .forEach(

            metric => {

                if(
                    scroll +
                    height *
                    .35 >=
                    metric.top
                ) {

                    active =
                        metric
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

    function render(
        timestamp
    ) {

        frame =
            0;


        const scroll =
            scrollY;


        progressBar
        .style
        .transform =
            `scaleX(
                ${
                    clamp(
                        scroll /
                        maxScroll
                    )
                }
            )`;


        updateNavigation(
            scroll
        );


        if(
            !builderEnabled ||
            document.hidden
        ) {

            lastRender =
                0;

            return;

        }


        updateBuild(
            scroll
        );


        updateCursors(
            timestamp,
            scroll
        );


        const moving =
            cursorObjects
            .some(

                cursor =>

                Math.abs(
                    cursor.targetX -
                    cursor.x
                ) +

                Math.abs(
                    cursor.targetY -
                    cursor.y
                ) >

                .3

            );


        if(
            moving ||
            autoplayActive
        ) {

            schedule();

        }

    }


    function schedule() {

        if(!frame) {

            frame =
                requestAnimationFrame(
                    render
                );

        }

    }


    /* =====================================================
       AUTOSCROLL
    ===================================================== */

    function stopAutoplay() {

        if(
            autoplayCancelled
        ) {

            return;

        }


        autoplayCancelled =
            true;


        autoplayActive =
            false;


        cancelAnimationFrame(
            autoplayFrame
        );


        status.classList
        .add(
            "off"
        );

    }


    function autoplay(
        timestamp
    ) {

        if(
            autoplayCancelled ||
            !builderEnabled
        ) {

            return;

        }


        if(!autoplayStart) {

            autoplayStart =
                timestamp;

        }


        autoplayActive =
            true;


        const elapsed =
            timestamp -
            autoplayStart;


        const progress =
            clamp(
                elapsed /
                AUTO_DURATION
            );


        /*
           This is intentionally mostly linear.
           It makes the cursors look like they
           are steadily constructing the site.
        */

        const eased =
            progress;


        window.scrollTo(

            0,

            maxScroll *
            eased

        );


        schedule();


        if(
            progress <
            1
        ) {

            autoplayFrame =
                requestAnimationFrame(
                    autoplay
                );

        }
        else {

            autoplayActive =
                false;


            status
            .classList
            .add(
                "off"
            );

        }

    }


    function startAutoplay() {

        if(
            autoplayCancelled ||
            !builderEnabled
        ) {

            return;

        }


        autoplayStart =
            0;


        autoplayFrame =
            requestAnimationFrame(
                autoplay
            );

    }


    /* =====================================================
       USER INPUT STOPS AUTO MODE
    ===================================================== */

    [
        "wheel",
        "touchstart",
        "pointerdown"
    ]
    .forEach(

        eventName => {

            window.addEventListener(

                eventName,

                () => {

                    if(
                        autoplayActive
                    ) {

                        stopAutoplay();

                    }

                },

                {
                    passive:
                        true
                }

            );

        }

    );


    window.addEventListener(

        "keydown",

        event => {

            if(
                [
                    "ArrowUp",
                    "ArrowDown",
                    "PageUp",
                    "PageDown",
                    "Home",
                    "End",
                    " "
                ]
                .includes(
                    event.key
                )
            ) {

                stopAutoplay();

            }

        }

    );


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if(menu) {

        menu.addEventListener(

            "click",

            () => {


                stopAutoplay();


                const open =
                    !nav
                    .classList
                    .contains(
                        "open"
                    );


                nav
                .classList
                .toggle(
                    "open",
                    open
                );


                menu
                .setAttribute(
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

    }


    /* =====================================================
       ENABLE / DISABLE
    ===================================================== */

    function revealEverything() {

        buildElements
        .forEach(

            element => {

                element
                .style
                .setProperty(
                    "--b",
                    "1"
                );

            }

        );


        typingObjects
        .forEach(

            object => {

                object.chars
                .forEach(

                    char =>
                    char.classList
                    .add(
                        "is-visible"
                    )

                );


                object.visibleCount =
                    object.chars
                    .length;

            }

        );

    }


    function configure() {

        builderEnabled =
            desktop.matches &&
            !reducedMotion.matches;


        root
        .classList
        .toggle(
            "builder-active",
            builderEnabled
        );


        if(
            !builderEnabled
        ) {

            revealEverything();


            status.classList
            .add(
                "off"
            );

        }


        measureBuildItems();

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


    let resizeTimer;


    window.addEventListener(

        "resize",

        () => {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(

                    configure,

                    120

                );

        }

    );


    reducedMotion
    .addEventListener(
        "change",
        configure
    );


    desktop
    .addEventListener(
        "change",
        configure
    );


    document
    .addEventListener(

        "visibilitychange",

        () => {

            lastRender =
                0;

            schedule();

        }

    );


    /* =====================================================
       START
    ===================================================== */

    function initialize() {

        prepareTyping();

        createCursors();

        configure();


        if(builderEnabled) {


            window.scrollTo(
                0,
                0
            );


            setTimeout(

                startAutoplay,

                AUTO_DELAY

            );

        }

    }


    initialize();


})();
