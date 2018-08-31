import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import * as fs from 'fs';
import {Converter} from 'showdown';

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

    private static filePath: string = 'manual/manual.md';


    constructor(private domSanitizer: DomSanitizer) {}


    async ngOnInit() {

        this.html = await this.loadHtml();
    }


    private async loadHtml(): Promise<SafeHtml> {

        const markdown: string = await this.getMarkdown();
        const htmlString: string = new Converter().makeHtml(markdown);

        return this.domSanitizer.bypassSecurityTrustHtml(htmlString);
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
}