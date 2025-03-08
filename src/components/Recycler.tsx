import { Fragment, JSX, useEffect, useRef, useState } from 'react';

/*
Recycler is a component that renders an infinite list of items.

Under-the-hood, it uses virtual pages, which is generally a clump of items. The
recycler shows all the visible pages, but also keeps one extra page above and
below the visible area.
*/

interface IPage<Id> {
    id: Id,
    render(): JSX.Element,
}

export function Recycler<Id extends { toString(): string }>(props: {
    // page state management is handled by parent
    pages: IPage<Id>[],
    setPages: (pages: IPage<Id>[]) => void,

    fetchPage: (id: Id) => Promise<IPage<Id>>,
    nextId: (id: Id) => Id,
    prevId: (id: Id) => Id,
}) {
    const firstPage = props.pages.length > 3 ? props.pages[0] : null;
    const middlePages = props.pages.length > 3 ? props.pages.slice(1, props.pages.length - 1) : props.pages;
    const lastPage = props.pages.length > 3 ? props.pages[props.pages.length - 1] : null;

    // 1. bufferBefore, a buffer page above everything, for seamless scrolling.
    //
    // 2. An intersection observer -- when visible, shift (new fetch) -> bufferBefore -> firstPage -> middlePages.
    //
    // 3. firstPage, the first visible page.
    //
    // 4. Intersection observer -- when not visible, shift middlePages -> firstPage -> bufferBefore -> (gone).
    //
    // 5. middlePages, the remaining pages.
    //
    // 6. Intersection observer -- when not visible, shift middlePages -> lastPage -> bufferAfter -> (gone).
    //
    // 7. lastPage, the last visible page.
    //
    // 8. An intersection observer -- when visible, shift (new fetch) -> bufferBefore -> firstPage -> middlePages.
    //
    // 9. bufferAfter, a buffer page after the visible pages, so that scrolling is seamless.


    const moreAfterMarker = useRef<HTMLDivElement>(null);
    const [bufferAfter, setBufferAfter] = useState<{ page: IPage<Id>, loading: false } | { loading: true }>(() => {
        const page = props.fetchPage(props.nextId(props.pages[props.pages.length - 1].id));
        page.then(page => {
            setBufferAfter({ page, loading: false });
        });

        return { loading: true };
    });

    // If moreAfterMarker is visible, move bufferAfterPage to pages, and fetch a new buffer page.

    useEffect(() => {
        if (!moreAfterMarker.current || bufferAfter.loading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    const p = props.fetchPage(props.nextId(bufferAfter.page.id));
                    props.setPages([...props.pages, bufferAfter.page]);
                    setBufferAfter({ loading: true });
                    p.then(page => {
                        setBufferAfter({ page, loading: false });
                    });
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(moreAfterMarker.current);

        return () => observer.disconnect();
    }, [props.pages, moreAfterMarker, bufferAfter]);

    return <>
        {firstPage && firstPage.render()}
        {middlePages.map(page => (
            <Fragment key={page.id.toString()}>
                {page.render()}
            </Fragment>
        ))}
        {lastPage && lastPage.render()}
        <div ref={moreAfterMarker} />
        {bufferAfter.loading ? <div>Loading...</div> : bufferAfter.page.render()}
    </>;
}
