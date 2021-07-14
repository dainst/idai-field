import { Component, Input, OnChanges } from '@angular/core';
import { subtract } from 'tsfun';
import { I18nString } from 'idai-field-core';
import { Language, LanguagesUtil } from '../../../core/util/languages-util';


@Component({
    selector: 'multi-language-input',
    templateUrl: './multi-language-input.html'
})
/**
* @author Thomas Kleinke
 */
export class MultiLanguageInputComponent implements OnChanges {
    
    @Input() translations: I18nString;
    @Input() defaultTranslations: I18nString;
    @Input() disabled: boolean = false;

    public languages: { [languageCode: string]: Language };
    public usedLanguages: string[];
    public unusedLanguages: string[];

    public newTranslationLanguage: string = '';


    public isDeleteButtonVisible = (languageCode: string) => !this.defaultTranslations[languageCode];

    public isRestoreButtonVisible = (languageCode: string) => this.defaultTranslations[languageCode]
        && this.translations[languageCode] !== this.defaultTranslations[languageCode];


    ngOnChanges() {

        this.languages = LanguagesUtil.getAvailableLanguages();
        this.reset();   
    }


    public getLanguageLabel(languageCode: string): string {

        return this.languages[languageCode].label;
    }


    public deleteTranslation(languageCode: string) {

        delete this.translations[languageCode];
        this.reset();
    }


    public addNewTranslation() {

        if (!this.newTranslationLanguage) return;

        this.translations[this.newTranslationLanguage] = '';
        this.reset();
    }


    public restoreDefaultTranslation(languageCode: string) {

        this.translations[languageCode] = this.defaultTranslations[languageCode];
    }


    private reset() {

        this.newTranslationLanguage = '';
        this.usedLanguages = Object.keys(this.translations);
        this.unusedLanguages = subtract(this.usedLanguages)(Object.keys(this.languages));
    }
}
