import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SortUtil } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';


@Component({
    templateUrl: './language-picker-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class LanguagePickerModalComponent {

    public languages: { [languageCode: string]: Language };

    private searchTerm: string = '';
    private searchResetTimeout: any;
    private sortedLanguages: Array<Language>;


    constructor(public activeModal: NgbActiveModal) {}


    public getLanguageCodes = () => Languages.getSortedLanguageCodes(this.languages);

    public getLabel = (languageCode: string) => this.languages[languageCode].label;

    public select = (languageCode: string) => this.activeModal.close(languageCode);


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key.length === 1) {
            this.searchTerm += event.key;
            this.scrollToSearchTermEntry();
            this.resetTimeout();
        }
    }


    public initialize() {

        this.sortedLanguages = LanguagePickerModalComponent.getSortedLanguages(this.languages);
    }


    private scrollToSearchTermEntry() {

        const targetLanguage: Language|undefined = this.getLanguageForSearchTerm();
        if (targetLanguage) this.scrollToLanguageEntry(targetLanguage);
    }


    private scrollToLanguageEntry(language: Language) {

        const element: HTMLElement|null = document.getElementById('language-option-' + language.code);
        if (!element) return;

        element.scrollIntoView(true);
    }


    private resetTimeout() {

        if (this.searchResetTimeout) clearTimeout(this.searchResetTimeout);
        this.searchResetTimeout = setTimeout(() => this.resetSearchTerm(), 700);
    }


    private resetSearchTerm() {

        this.searchTerm = '';
        this.searchResetTimeout = undefined;
    }


    private getLanguageForSearchTerm(): Language|undefined {

        return this.sortedLanguages.find(language => {
            return language.label.toLowerCase().startsWith(this.searchTerm.toLowerCase());
        });
    }


    private static getSortedLanguages(languages: { [languageCode: string]: Language }): Array<Language> {

        return Object.values(languages).sort((language1, language2) => {
            return SortUtil.alnumCompare(language1.label, language2.label);
        });
    }
}
