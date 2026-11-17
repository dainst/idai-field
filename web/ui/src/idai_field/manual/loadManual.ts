import { flow } from 'tsfun';
import { Chapter } from './Manual';
import { getLatestDesktopVersion } from '../getLatestDesktopVersion';
import { getManualLanguage } from '../../shared/languages';


export const loadManual = async (): Promise<{ markdown: string, chapters: Chapter[] }> => {

    const latestVersion: string = await getLatestDesktopVersion();
    const url: string = 'https://raw.githubusercontent.com/dainst/idai-field/v' + latestVersion + '/desktop/src/manual';

    const markdownText: string = flow(
        await loadMarkdown(url),
        fixImageLinks(url),
        setHeadingIds
    );

    return {
        markdown: markdownText,
        chapters: getChapters(markdownText)
    };
};


const loadMarkdown = (url: string): Promise<string> => {

    return new Promise<string>(resolve => {
        const request = new XMLHttpRequest();
        request.addEventListener('load', () => resolve(request.response));
        request.open('GET', `${url}/manual.${getManualLanguage()}.md`);
        request.send();
    });
};


const setHeadingIds = (markdown: string): string => {

    return markdown.replace(
        /(^|\n)# .*\n/g,
        (text: string) => {
            const heading: string = text
                .replace('# ', '')
                .replace(/\n/g, '');
            const id: string = heading.replace(' ', '-').toLowerCase();
            return `<h1 id="${id}">${heading}</h1>\n`;
        }
    );
};


const getChapters = (markdown: string): Chapter[] => {

    const matches = markdown.match(/<h1 id=".*">.*<\/h1>/g);

    return matches.map(match => {
        const result = /<h1 id="(.*)">(.*)<\/h1>/g.exec(match);
        return {
            id: result[1],
            label: result[2]
        };
    });
};


const fixImageLinks = (url: string) => (markdown: string): string => {

    return markdown.replace(
        /img src="images/g,
        `img src="${url}/images`
    );
};
