import { Component, Input, OnChanges } from '@angular/core';
import { I18nString } from 'idai-field-core';
import { Language, LanguagesUtil } from '../../core/util/languages-util';


type Translation = {
    language: string;
    text: string;
};


@Component({
    selector: 'multi-language-input',
    templateUrl: './multi-language-input.html'
})
/**
* @author Thomas Kleinke
 */
export class MultiLanguageInputComponent implements OnChanges {
    
    @Input() translations: I18nString;

    public languages: { [languageCode: string]: Language };
    public unusedLanguages: string[];

    public newTranslationLanguage: string;
    public newTranslationText: string;


    ngOnChanges() {

        this.languages = LanguagesUtil.getAvailableLanguages();
        this.reset();   
    }


    public getLanguageLabel(languageCode: string): string {

        return this.languages[languageCode].label;
    }


    public getTranslationLanguages(): string[] {

        return Object.keys(this.translations);
    }


    public deleteTranslation(languageCode: string) {

        delete this.translations[languageCode];
        this.reset();
    }


    public isNewTranslationValid(): boolean {

        return this.newTranslationLanguage !== undefined && this.newTranslationText !== undefined;
    }


    public addNewTranslation() {

        if (!this.isNewTranslationValid) return;

        this.translations[this.newTranslationLanguage] = this.newTranslationText;
        this.reset();
    }


    private reset() {

        this.newTranslationLanguage = undefined;
        this.newTranslationText = undefined;
        this.unusedLanguages = Object.keys(
            LanguagesUtil.getUnselectedLanguages(this.languages, Object.keys(this.translations))
        );
    }
}
