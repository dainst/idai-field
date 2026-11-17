import React, { ReactElement, useEffect, useRef, useState } from 'react';
import ChapterNavigation from './ChapterNavigation';
import { loadManual } from './loadManual';
import MarkdownViewer from './MarkdownViewer';


export type Chapter = {
    id: string,
    label: string
};


export default function Manual(): ReactElement {

    const [markdown, setMarkdown] = useState('');
    const [chapters, setChapters] = useState([]);
    const [activeChapter, setActiveChapter] = useState(undefined);

    const manualElementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadManual().then(result => {
            setMarkdown(result.markdown);
            setChapters(result.chapters);
            if (result.chapters.length > 0) setActiveChapter(result.chapters[0]);
        });
    }, []);

    return (
        <div>
            <ChapterNavigation chapters={ chapters }
                               activeChapter={ activeChapter }
                               setActiveChapter={ setActiveChapter }
                               manualElementRef={ manualElementRef } />
            <MarkdownViewer markdown={ markdown }
                            chapters={ chapters }
                            setActiveChapter={ setActiveChapter }
                            manualElementRef={ manualElementRef } />
        </div>
    );
}
