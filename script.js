(() => {

    'use strict';


    const root =
        document.documentElement;


    const nav =
        document.querySelector(
            '#navigation'
        );


    const menu =
        document.querySelector(
            '.menu-toggle'
        );


    const progress =
        document.querySelector(
            '.scroll-progress'
        );


    const hero =
        document.querySelector(
            '.hero'
        );


    const buildTargets = [
        ...document.querySelectorAll(
            '[data-build]'
        )
    ];


    const chapters = [
        ...document.querySelectorAll(
            '.chapter'
        )
    ];


    const layer =
        document.querySelector(
            '#builder-layer'
        );


    const year =
        document.querySelector(
            '#year'
        );


    const reduced =
        matchMedia(
            '(prefers-reduced-motion: reduce)'
        );


    const desktop =
        matchMedia(
            '(min-width: 1001px) and (min-height: 650px) and (pointer: fine)'
        );


    const clamp =
        (
            n,
            a = 0,
            b = 1
        ) =>
        Math.min(
            b,
            Math.max(
                a,
                n
            )
        );


    const smooth =
        n =>
        n *
        n *
        (
            3 -
            2 *
            n
        );


    const smoother =
        n =>
        n *
        n *
        n *
        (
            n *
            (
                n *
                6 -
                15
            ) +
            10
        );


    const colors = [

        '#55d7ff',

        '#ff5b4d',

        '#9ee37d',

        '#f5d547',

        '#c28cff',

        '#68f0cf',

        '#ff8ac8'

    ];


    const labels = [

        'ELEC',

        'UI',

        'MECH',

        'DATA',

        'AERO',

        'PCB',

        'OPS'

    ];


    const cursorCount =
        colors.length;


    let enabled =
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


    let targetData =
        [];


    let chapterData =
        [];


    let routes =
        [];


    let lastTime =
        0;


    const cursors =
        [];


    const boxes =
        [];


    if(year) {

        year.textContent =
            new Date()
            .getFullYear();

    }


    function makeCursor(index) {

        const el =
            document
            .createElement(
                'div'
            );


        el.className =
            'builder-cursor';


        el.style
        .setProperty(
            '--cursor-color',
            colors[index]
        );


        el.innerHTML = `

            <svg
                viewBox="0 0 22 27"
                aria-hidden="true"
            >

                <path
                    d="
                        M2 2
                        L19 16.5
                        L12.2 17.2
                        L9.2 24.5
                        Z
                    "
                ></path>

            </svg>


            <span class="cursor-tag">
                ${labels[index]}
            </span>


            <i class="cursor-pulse"></i>

        `;


        layer.appendChild(
            el
        );


        const box =
            document
            .createElement(
                'div'
            );


        box.className =
            'build-box';


        box.style
        .setProperty(
            '--box-color',
            colors[index]
        );


        box.innerHTML = `

            <span class="box-label">
                ${labels[index]} / BUILD
            </span>

        `;


        layer.appendChild(
            box
        );


        const angle =
            (
                Math.PI *
                2 *
                index
            ) /
            cursorCount;


        return {

            el,

            box,

            x:
                width *
                .5 +
                Math.cos(
                    angle
                ) *
                18,

            y:
                height *
                .5 +
                Math.sin(
                    angle
                ) *
                18,

            tx:
                width *
                .5,

            ty:
                height *
                .5,

            activeKey:
                '',

            pulseTimer:
                0

        };

    }


    for(
        let i = 0;
        i < cursorCount;
        i++
    ) {

        const item =
            makeCursor(
                i
            );


        cursors.push(
            item
        );


        boxes.push(
            item.box
        );

    }


    function closeMenu() {

        nav.classList
        .remove(
            'open'
        );


        menu.setAttribute(
            'aria-expanded',
            'false'
        );


        menu.textContent =
            'Menu +';

    }


    menu.addEventListener(

        'click',

        () => {

            const open =
                !nav.classList
                .contains(
                    'open'
                );


            nav.classList
            .toggle(
                'open',
                open
            );


            menu.setAttribute(
                'aria-expanded',
                String(
                    open
                )
            );


            menu.textContent =
                open
                ? 'Close −'
                : 'Menu +';

        }

    );


    nav.addEventListener(

        'click',

        event => {

            if(
                event.target
                .closest(
                    'a'
                )
            ) {

                closeMenu();

            }

        }

    );


    function schedule() {

        if(!frame) {

            frame =
                requestAnimationFrame(
                    render
                );

        }

    }


    function docTop(el) {

        const rect =
            el.getBoundingClientRect();


        return (
            rect.top +
            scrollY
        );

    }


    function measure() {

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
            enabled

            ? Math.max(

                1,

                hero.offsetHeight -
                height

            )

            : 1;


        targetData =
            buildTargets
            .map(

                (
                    el,
                    index
                ) => {

                    const phase =
                        Number(
                            el.dataset
                            .buildPhase
                        );


                    const cursor =
                        Number.isFinite(
                            Number(
                                el.dataset
                                .cursor
                            )
                        )

                        ? Number(
                            el.dataset
                            .cursor
                        ) %
                        cursorCount

                        : index %
                        cursorCount;


                    const top =
                        docTop(
                            el
                        );


                    const at =
                        Number.isFinite(
                            phase
                        )

                        ? heroTravel *
                        phase

                        : Math.max(

                            heroTravel *
                            .42,

                            top -
                            height *
                            .70

                        );


                    return {

                        el,

                        cursor,

                        at,

                        top,

                        index,

                        key:
                            `${cursor}:${index}`

                    };

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


        routes =
            Array.from(

                {
                    length:
                        cursorCount
                },

                (
                    _,
                    cursorIndex
                ) => {


                    const angle =
                        (
                            Math.PI *
                            2 *
                            cursorIndex
                        ) /
                        cursorCount;


                    const start = {

                        synthetic:
                            true,

                        at:
                            -height *
                            .05,

                        x:
                            width *
                            .5 +
                            Math.cos(
                                angle
                            ) *
                            20,

                        y:
                            height *
                            .48 +
                            Math.sin(
                                angle
                            ) *
                            20,

                        key:
                            `start-${cursorIndex}`

                    };


                    return [

                        start,

                        ...targetData
                        .filter(

                            item =>
                            item.cursor ===
                            cursorIndex

                        )

                    ];

                }

            );


        chapterData =
            chapters
            .map(

                el => ({

                    el,

                    top:
                        docTop(
                            el
                        )

                })

            );


        schedule();

    }


    function configure() {

        enabled =
            desktop.matches &&
            !reduced.matches;


        root.classList
        .toggle(

            'builder-enabled',

            enabled

        );


        if(!enabled) {

            buildTargets
            .forEach(

                el =>
                el.style
                .setProperty(
                    '--build',
                    '1'
                )

            );


            boxes
            .forEach(

                box =>
                box.style.opacity =
                    '0'

            );

        }


        measure();

    }


    function pulse(cursor) {

        cursor.el
        .classList
        .remove(
            'click'
        );


        clearTimeout(
            cursor.pulseTimer
        );


        requestAnimationFrame(

            () =>
            cursor.el
            .classList
            .add(
                'click'
            )

        );


        cursor.pulseTimer =
            setTimeout(

                () =>
                cursor.el
                .classList
                .remove(
                    'click'
                ),

                520

            );

    }


    function targetPoint(
        item,
        cursorIndex
    ) {

        if(
            item.synthetic
        ) {

            return {

                x:
                    item.x,

                y:
                    item.y,

                rect:
                    null

            };

        }


        const rect =
            item.el
            .getBoundingClientRect();


        const presets = [

            [
                .18,
                .32
            ],

            [
                .78,
                .25
            ],

            [
                .52,
                .52
            ],

            [
                .28,
                .72
            ],

            [
                .82,
                .68
            ],

            [
                .64,
                .38
            ],

            [
                .42,
                .82
            ]

        ];


        const [
            fx,
            fy
        ] =
        presets[
            cursorIndex %
            presets.length
        ];


        return {

            x:
                clamp(

                    rect.left +
                    rect.width *
                    fx,

                    18,

                    width -
                    120

                ),

            y:
                clamp(

                    rect.top +
                    rect.height *
                    fy,

                    90,

                    height -
                    55

                ),

            rect

        };

    }


    function routeSegment(
        route,
        s
    ) {

        let i =
            0;


        while(

            i <
            route.length -
            2 &&

            s >=
            route[
                i + 1
            ].at

        ) {

            i++;

        }


        const a =
            route[i];


        const b =
            route[
                Math.min(

                    i + 1,

                    route.length -
                    1

                )
            ];


        const span =
            Math.max(

                1,

                b.at -
                a.at

            );


        const raw =
            clamp(

                (
                    s -
                    a.at
                ) /
                span

            );


        const t =
            smoother(

                clamp(

                    (
                        raw -
                        .22
                    ) /
                    .56

                )

            );


        return {

            a,

            b,

            raw,

            t

        };

    }


    function updateTargetBuild(s) {

        targetData
        .forEach(

            item => {

                const local =
                    smooth(

                        clamp(

                            (
                                s -
                                item.at +
                                height *
                                .06
                            ) /
                            (
                                height *
                                .20
                            )

                        )

                    );


                item.el.style
                .setProperty(

                    '--build',

                    local
                    .toFixed(
                        3
                    )

                );

            }

        );

    }


    function updateBox(
        cursor,
        target,
        raw
    ) {

        if(
            !target ||
            target.synthetic
        ) {

            cursor.box
            .style.opacity =
                '0';


            return;

        }


        const rect =
            target.el
            .getBoundingClientRect();


        const inView =

            rect.bottom >
            86 &&

            rect.top <
            height -
            30;


        const arrival =

            1 -

            Math.min(

                1,

                Math.abs(
                    raw -
                    1
                ) *
                5.5

            );


        const opacity =

            inView

            ? clamp(
                arrival
            )

            : 0;


        const pad =
            5;


        cursor.box
        .style.opacity =
            opacity
            .toFixed(
                2
            );


        cursor.box
        .style.width =
            `${
                Math.max(

                    8,

                    rect.width +
                    pad *
                    2

                )
            }px`;


        cursor.box
        .style.height =
            `${
                Math.max(

                    8,

                    rect.height +
                    pad *
                    2

                )
            }px`;


        cursor.box
        .style.transform =

            `translate3d(
                ${rect.left - pad}px,
                ${rect.top - pad}px,
                0
            )`;

    }


    function updateNavigation(s) {

        let active =
            chapterData[0]
            ?.el.id ||
            'home';


        chapterData
        .forEach(

            item => {

                if(

                    s +
                    height *
                    .34 >=
                    item.top

                ) {

                    active =
                        item.el.id;

                }

            }

        );


        nav.querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(

            link => {

                link.toggleAttribute(

                    'aria-current',

                    link.hash ===
                    `#${active}`

                );


                if(
                    link.hasAttribute(
                        'aria-current'
                    )
                ) {

                    link.setAttribute(
                        'aria-current',
                        'location'
                    );

                }

            }

        );

    }


    function render(time) {

        frame =
            0;


        const s =
            scrollY;


        progress.style
        .transform =

            `scaleX(
                ${clamp(
                    s /
                    maxScroll
                )}
            )`;


        updateNavigation(
            s
        );


        if(
            !enabled ||
            document.hidden
        ) {

            lastTime =
                0;


            return;

        }


        updateTargetBuild(
            s
        );


        const dt =
            lastTime

            ? Math.min(

                50,

                time -
                lastTime

            )

            : 16;


        lastTime =
            time;


        const follow =

            1 -

            Math.exp(

                -dt /
                78

            );


        routes
        .forEach(

            (
                route,
                index
            ) => {


                const cursor =
                    cursors[
                        index
                    ];


                const {

                    a,

                    b,

                    raw,

                    t

                } =
                routeSegment(
                    route,
                    s
                );


                const pa =
                    targetPoint(
                        a,
                        index
                    );


                const pb =
                    targetPoint(
                        b,
                        index
                    );


                const arc =
                    Math.sin(
                        t *
                        Math.PI
                    );


                cursor.tx =

                    pa.x +

                    (
                        pb.x -
                        pa.x
                    ) *
                    t +

                    (
                        index %
                        2

                        ? 1

                        : -1
                    ) *

                    arc *

                    (
                        22 +
                        index *
                        2
                    );


                cursor.ty =

                    pa.y +

                    (
                        pb.y -
                        pa.y
                    ) *
                    t -

                    arc *

                    (
                        16 +

                        (
                            index %
                            3
                        ) *
                        5
                    );


                cursor.x +=

                    (
                        cursor.tx -
                        cursor.x
                    ) *
                    follow;


                cursor.y +=

                    (
                        cursor.ty -
                        cursor.y
                    ) *
                    follow;


                cursor.el.style
                .transform =

                    `translate3d(
                        ${cursor.x}px,
                        ${cursor.y}px,
                        0
                    )`;


                const activeTarget =

                    raw >
                    .52

                    ? b

                    : a;


                const activeKey =

                    activeTarget
                    ?.key ||
                    '';


                if(

                    activeKey &&

                    activeKey !==
                    cursor.activeKey &&

                    !activeTarget
                    .synthetic

                ) {

                    pulse(
                        cursor
                    );


                    cursor.activeKey =
                        activeKey;

                }


                updateBox(
                    cursor,
                    b,
                    raw
                );

            }

        );


        const moving =
            cursors
            .some(

                c =>

                Math.abs(
                    c.tx -
                    c.x
                ) +

                Math.abs(
                    c.ty -
                    c.y
                ) >

                .35

            );


        if(
            moving
        ) {

            schedule();

        }

    }


    addEventListener(

        'scroll',

        schedule,

        {
            passive: true
        }

    );


    addEventListener(

        'load',

        measure

    );


    addEventListener(

        'pageshow',

        measure

    );


    let resizeTimer =
        0;


    addEventListener(

        'resize',

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


    reduced.addEventListener(

        'change',

        configure

    );


    desktop.addEventListener(

        'change',

        configure

    );


    document.addEventListener(

        'visibilitychange',

        () => {

            lastTime =
                0;


            schedule();

        }

    );


    configure();


})();
