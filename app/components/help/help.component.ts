import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import * as fs from 'fs';
import {Converter} from 'showdown';

type Chapter = { id: string, label: string };


@Component({
    moduleId: module.id,
    selector: 'help',
    templateUrl: './help.html'
})
/**
 * @author Thomas Kleinke
 */
export class HelpComponent implements OnInit {

    public html: SafeHtml;
    public chapters: Array<Chapter> = [];
    public activeChapter: Chapter;

    @ViewChild('help') rootElement: ElementRef;

    private static filePath: string = 'manual/manual.md';
    private static scrollOffset: number = -15;
    private static headerTopOffset: number = -62;


    constructor(private domSanitizer: DomSanitizer) {}


    async ngOnInit() {

        await this.load();
        if (this.chapters.length > 0) this.activeChapter = this.chapters[0];
    }


    public scrollToChapter(chapter: Chapter) {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return;

        element.scrollIntoView(true);
        this.rootElement.nativeElement.scrollTop += HelpComponent.scrollOffset;
    }


    public updateActiveElement() {

        let activeElementTop: number = 1;

        this.chapters.forEach(chapter => {
            const top: number = HelpComponent.getHeaderTop(chapter);
            if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
                activeElementTop = top;
                this.activeChapter = chapter;
            }
        });
    }


    private async load() {

        const markdown: string = await this.getMarkdown();
        const htmlString: string = HelpComponent.createMarkdownConverter().makeHtml(markdown);

        this.html = this.domSanitizer.bypassSecurityTrustHtml(htmlString);
        this.chapters = HelpComponent.getChapters(htmlString);
    }


    private async getMarkdown(): Promise<string> {

        const markdown: string = await this.readMarkdownFile();
        return HelpComponent.adjustImageLinks(markdown);
    }


    private readMarkdownFile(): Promise<string> {

        return new Promise<string>(resolve => {
            fs.readFile(HelpComponent.filePath, 'utf-8', (err: any, content: string) => {
                if (err) {
                    resolve('');
                } else {
                    resolve(content);
                }
            });
        });
    }


    private static adjustImageLinks(markdown: string): string {

        return markdown.replace(/img src="images/g, 'img src="manual/images');
    }


    private static createMarkdownConverter(): Converter {

        const converter: Converter = new Converter();
        converter.setOption('prefixHeaderId', 'chapter');

        return converter;
    }


    private static getChapters(htmlString: string): Array<Chapter> {

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


    private static getHeaderTop(chapter: Chapter): number {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return 1;

        return element.getBoundingClientRect().top
            + HelpComponent.headerTopOffset
            + HelpComponent.scrollOffset;
    }
}