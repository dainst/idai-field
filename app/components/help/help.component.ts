import {Component, OnInit} from '@angular/core';
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

    public html: string = '';

    private static filePath: string = 'manual/manual.md';


    async ngOnInit() {

        this.html = await this.loadHtml();
    }


    private async loadHtml(): Promise<string> {

        const markdown: string = await this.getMarkdown();
        const converter: Converter = HelpComponent.createConverter();

        return converter.makeHtml(markdown);
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

        return markdown.replace(/\]\(images\//g, '](manual/images/');
    }


    private static createConverter(): Converter {

        const converter: Converter = new Converter();
        converter.setOption('noHeaderId', true);

        return converter;
    }
}