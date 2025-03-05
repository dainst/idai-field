import { HttpClient } from '@angular/common/http';
import { Converter } from 'showdown';
import { HttpReader } from '../../components/import/reader/http-reader';


export type Chapter = { id: string, label: string };


/**
 * @author Thomas Kleinke
 */
export module HelpLoader {

    export async function load(filePath: string, folderPath: string, http: HttpClient) {

        const markdown: string = await getMarkdown(filePath, folderPath, http);
        const htmlString: string = createMarkdownConverter().makeHtml(markdown);

        return {
            html: htmlString,
            chapters: getChapters(htmlString)
        };
    }


    function adjustImageLinks(markdown: string, folderPath: string): string {

        return markdown.replace(/img src="images/g, 'img src="' + folderPath + '/images');
    }


    function createMarkdownConverter(): Converter {

        const converter: Converter = new Converter();
        converter.setOption('prefixHeaderId', 'chapter');

        return converter;
    }


    function getChapters(htmlString: string): Array<Chapter> {

        const chapters: Array<Chapter> = [];

        const document = new DOMParser().parseFromString(htmlString, 'text/html');
        const elements = document.getElementsByTagName('h1');

        for (let i = 0; i < elements.length; i++) {
            chapters.push({
                id: (elements.item(i) as Element).id,
                label: (elements.item(i) as Element).textContent as string
            });
        }

        return chapters;
    }


    async function getMarkdown(filePath: string, folderPath: string, http: HttpClient): Promise<string> {

        const reader = new HttpReader(filePath, http);
        const markdown: string = await reader.go();
        return adjustImageLinks(markdown, folderPath);
    }
}
