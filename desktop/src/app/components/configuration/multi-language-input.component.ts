import { Component, Input, OnChanges } from '@angular/core';
import { subtract } from 'tsfun';
import { I18nString } from 'idai-field-core';
import { Language, LanguagesUtil } from '../../core/util/languages-util';


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

    public languages: { [languageCode: string]: Language };
    public usedLanguages: string[];
    public unusedLanguages: string[];

    public newTranslationLanguage: string = '';
    public newTranslationText: string = '';


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


    public isNewTranslationValid(): boolean {

        return this.newTranslationLanguage !== undefined && this.newTranslationLanguage.length > 0
            && this.newTranslationText !== undefined && this.newTranslationText.length > 0;
    }


    public addNewTranslation() {

        if (!this.isNewTranslationValid) return;

        this.translations[this.newTranslationLanguage] = this.newTranslationText;
        this.reset();
    }


    public restoreDefaultTranslation(languageCode: string) {

        this.translations[languageCode] = this.defaultTranslations[languageCode];
    }


    private reset() {

        this.newTranslationLanguage = '';
        this.newTranslationText = '';
        this.usedLanguages = Object.keys(this.translations);
        this.unusedLanguages = subtract(this.usedLanguages)(Object.keys(this.languages));
    }
}
