import React, { CSSProperties, ReactElement, RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { NAVBAR_HEIGHT } from '../../constants';
import { CHAPTER_NAVIGATION_WIDTH, PADDING } from './constants';
import { Chapter } from './Manual';
import './MarkdownViewer.css';


interface MarkdownViewerProps {
    markdown: string;
    chapters: Chapter[];
    setActiveChapter: (activeChapter: Chapter) => void;
    manualElementRef: RefObject<HTMLDivElement>;
}


export default function MarkdownViewer(
    { markdown, chapters, setActiveChapter, manualElementRef }: MarkdownViewerProps): ReactElement {

    return (
        <div id="markdown-viewer"
                ref={ manualElementRef }
                style={ markdownContainerStyle }
                onScroll={ () => updateActiveChapter(chapters, setActiveChapter) }>
            <ReactMarkdown rehypePlugins={ [rehypeRaw] }>{ markdown }</ReactMarkdown>
        </div>
    );
}


const updateActiveChapter = (chapters: Chapter[], setActiveChapter: (chapter: Chapter) => void): void => {

    let activeElementTop: number = 1;

    chapters.forEach(chapter => {
        const top: number = getHeaderTop(chapter);
        if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
            activeElementTop = top;
            setActiveChapter(chapter);
        }
    });
};


const getHeaderTop = (chapter: Chapter): number => {

    const element: HTMLElement | null = document.getElementById(chapter.id);
    if (!element) return 1;

    return element.getBoundingClientRect().top
        - NAVBAR_HEIGHT
        - PADDING;
};


const markdownContainerStyle: CSSProperties = {
    position: 'relative',
    left: CHAPTER_NAVIGATION_WIDTH + 'px',
    width: 'calc(100vw - ' + CHAPTER_NAVIGATION_WIDTH + 'px)',
    height: 'calc(100vh - ' + NAVBAR_HEIGHT + 'px)',
    padding: PADDING + 'px',
    overflowY: 'auto'
};
