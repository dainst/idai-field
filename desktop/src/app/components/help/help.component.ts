import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Chapter, HelpLoader } from './help-loader';
import { TabManager } from '../../services/tabs/tab-manager';
import { SettingsService } from '../../services/settings/settings-service';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { Settings } from '../../services/settings/settings';

const remote = globalThis.require('@electron/remote');


const HELP_LANGUAGES = ['de', 'en'];
const FALLBACK_LANGUAGE = 'en';


@Component({
    selector: 'help',
    templateUrl: './help.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class HelpComponent implements OnInit {

    public html: SafeHtml;
    public chapters: Array<Chapter> = [];
    public activeChapter: Chapter;

    @ViewChild('help', { static: false }) rootElement: ElementRef;

    private static scrollOffset: number = -15;
    private static headerTopOffset: number = -62;


    constructor(private domSanitizer: DomSanitizer,
                private http: HttpClient,
                private settingsService: SettingsService,
                private tabManager: TabManager,
                private changeDetectorRef: ChangeDetectorRef,
                private menuService: Menus) {}


    async ngOnInit() {

        const folderPath: string = remote.getGlobal('manualPath');

        const {html, chapters} = await HelpLoader.load(
            HelpComponent.getFilePath(HelpComponent.getLocale(), folderPath),
            folderPath,
            this.http,
            this.domSanitizer
        );

        this.html = html;
        this.chapters = chapters;
        if (this.chapters.length > 0) this.activeChapter = this.chapters[0];
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public scrollToChapter(chapter: Chapter) {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return;

        element.scrollIntoView(true);
        this.rootElement.nativeElement.scrollTop += HelpComponent.scrollOffset;
    }


    public updateActiveChapter() {

        let activeElementTop: number = 1;

        this.chapters.forEach(chapter => {
            const top: number = HelpComponent.getHeaderTop(chapter);
            if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
                activeElementTop = top;
                this.activeChapter = chapter;
            }
        });
        this.changeDetectorRef.detectChanges();
    }


    private static getFilePath(locale: string, folderPath: string): string {

        return folderPath + '/manual.' + locale + '.md';
    }


    private static getLocale(): string {

        const locale: string = Settings.getLocale();
        return HELP_LANGUAGES.includes(locale) ? locale : FALLBACK_LANGUAGE;
    }


    private static getHeaderTop(chapter: Chapter): number {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return 1;

        return element.getBoundingClientRect().top
            + HelpComponent.headerTopOffset
            + HelpComponent.scrollOffset;
    }
}
