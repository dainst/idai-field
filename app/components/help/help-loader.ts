import {DomSanitizer} from '@angular/platform-browser';
import {Http} from '@angular/http';
import {Converter} from 'showdown';
import {HttpReader} from '../../core/import/http-reader';

export type Chapter = { id: string, label: string };

/**
 * @author Thomas Kleinke
 */
export module HelpLoader {

    export async function load(filePath: string, http: Http, domSanitizer: DomSanitizer) {

        const markdown: string = await getMarkdown(filePath, http);
        const htmlString: string = createMarkdownConverter().makeHtml(markdown);

        return {
            html: domSanitizer.bypassSecurityTrustHtml(htmlString),
            chapters: getChapters(htmlString)
        };
    }

    function adjustImageLinks(markdown: string): string {

        return markdown.replace(/img src="images/g, 'img src="manual/images');
    }


    function createMarkdownConverter(): Converter {

        const converter: Converter = new Converter();
        converter.setOption('prefixHeaderId', 'chapter');

        return converter;
    }


    function getChapters(htmlString: string): Array<Chapter> {

        const chapters: Array<Chapter> = [];

        const document = new DOMParser().parseFromString(htmlString, 'text/html');
        const elements = document.getElementsByTagName('h2');

        for (let i = 0; i < elements.length; i++) {
            chapters.push({
                id: elements.item(i).id,
                label: elements.item(i).textContent as string
            });
        }

        return chapters;
    }


    async function getMarkdown(filePath: string, http: Http): Promise<string> {

        const reader = new HttpReader(filePath, http);
        const markdown: string = await reader.go();
        return adjustImageLinks(markdown);
    }
}