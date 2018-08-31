import {DomSanitizer} from '@angular/platform-browser';
import {Converter} from 'showdown';
import * as fs from "fs";

export type Chapter = { id: string, label: string };

/**
 * @author Thomas Kleinke
 */
export module HelpLoader {

    export async function load(filePath: string, domSanitizer: DomSanitizer) {

        const markdown: string = await getMarkdown(filePath);
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


    async function getMarkdown(filePath: string): Promise<string> {

        const markdown: string = await readFile(filePath);
        return adjustImageLinks(markdown);
    }


    function readFile(filePath: string): Promise<string> {

        return new Promise<string>(resolve => {
            fs.readFile(filePath, 'utf-8', (err: any, content: string) => {
                if (err) {
                    resolve('');
                } else {
                    resolve(content);
                }
            });
        });
    }
}