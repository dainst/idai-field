import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Chapter, HelpLoader } from './help-loader';
import { TabManager } from '../../services/tabs/tab-manager';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { Settings } from '../../services/settings/settings';
import { AngularUtility } from '../../angular/angular-utility';

const remote = window.require('@electron/remote');


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
    public searchResults: HTMLCollectionOf<Element>;
    public hasSearchResults: boolean;

    private htmlString: string;
    private searchResultIndex: number;

    @ViewChild('help', { static: false }) rootElement: ElementRef;

    private static scrollOffset: number = -15;
    private static headerTopOffset: number = -62;


    constructor(private domSanitizer: DomSanitizer,
                private http: HttpClient,
                private tabManager: TabManager,
                private changeDetectorRef: ChangeDetectorRef,
                private menuService: Menus) {}


    async ngOnInit() {

        const folderPath: string = remote.getGlobal('manualPath');

        const { html, chapters } = await HelpLoader.load(
            HelpComponent.getFilePath(HelpComponent.getLocale(), folderPath),
            folderPath,
            this.http
        );

        this.htmlString = html;
        this.html = this.domSanitizer.bypassSecurityTrustHtml(this.htmlString);
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
        this.scrollToElement(element);
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


    public async onSearchInputKeyUp(event: KeyboardEvent, searchTerm: string) {

        if (event.key === 'Enter') {
            this.scrollToNextSearchResult();
        } else if (!['Alt', 'Shift', 'Control', 'Tab', 'Meta', 'ArrowTop', 'ArrowRight', 'ArrowDown', 'ArrowLeft']
                .includes(event.key)) {
            await this.search(searchTerm);
            this.hasSearchResults = this.searchResults?.length > 0;
        }
    }


    public scrollToPreviousSearchResult() {

        if (this.searchResultIndex > 0) {
            this.scrollToSearchResult(this.searchResultIndex - 1);
        } else {
            this.scrollToSearchResult(this.searchResults.length - 1);
        }
    }


    public scrollToNextSearchResult() {

        if (this.searchResultIndex < this.searchResults.length - 1) {
            this.scrollToSearchResult(this.searchResultIndex + 1);
        } else {
            this.scrollToSearchResult(0);
        }
    }


    private async search(searchTerm: string) {

        searchTerm = searchTerm?.trim();

        const updatedHtmlString: string = searchTerm.length
            ? this.replaceSearchString(searchTerm)
            : this.htmlString;

        this.html = this.domSanitizer.bypassSecurityTrustHtml(updatedHtmlString);

        await AngularUtility.refresh();

        this.searchResults = document.getElementsByClassName('search-result');
        this.searchResultIndex = 0;

        if (this.searchResults.length > 0) this.scrollToSearchResult(0);
        this.changeDetectorRef.detectChanges();
    }

    
    private replaceSearchString(searchTerm: string) {

        const lowerCaseSearchTerm: string = searchTerm[0].toLowerCase() + searchTerm.slice(1);
        const upperCaseSearchTerm: string = searchTerm[0].toUpperCase() + searchTerm.slice(1);

        let result: string = '';
        let content: string = '';
        let cursor: number = 0;

        do {
            const character: string = this.htmlString[cursor];
            if (character === '<') {
                if (content.length) {
                    let updatedContent: string = content.replaceAll(
                        lowerCaseSearchTerm,
                        '<span class="search-result">' + lowerCaseSearchTerm + '</span>'
                    );
                    if (lowerCaseSearchTerm !== upperCaseSearchTerm) {
                        updatedContent = updatedContent.replaceAll(
                            upperCaseSearchTerm,
                            '<span class="search-result">' + upperCaseSearchTerm + '</span>'
                        );
                    }
                    result += updatedContent;
                }
                content = character;
            } else if (character === '>') {
                result += content + character;
                content = '';
            } else {
                content += character;
            }
        } while (++cursor < this.htmlString.length);

        return result;
    }


    private scrollToSearchResult(index: number) {

        if (this.searchResultIndex !== undefined) {
            (this.searchResults.item(this.searchResultIndex) as HTMLElement).classList
                .remove('selected-search-result');
        }

        if (this.searchResults.length > index) {
            const element: HTMLElement = this.searchResults.item(index) as HTMLElement;
            element.classList.add('selected-search-result');
            this.scrollToElement(element, 2);
            this.searchResultIndex = index;
        }
    }


    private scrollToElement(element: HTMLElement, offset: number = 0) {

        if (!element) return;

        element.scrollIntoView(true);
        this.rootElement.nativeElement.scrollTop += HelpComponent.scrollOffset + offset;
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
