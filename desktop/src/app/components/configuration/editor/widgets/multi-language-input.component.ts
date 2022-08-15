import { Component, Input, OnChanges } from '@angular/core';
import { subtract } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';


@Component({
    selector: 'multi-language-input',
    templateUrl: './multi-language-input.html'
})
/**
* @author Thomas Kleinke
 */
export class MultiLanguageInputComponent implements OnChanges {

    @Input() translations: I18N.String;
    @Input() defaultTranslations: I18N.String;
    @Input() projectLanguages: string[];
    @Input() disabled: boolean = false;

    public languages: { [languageCode: string]: Language };
    public usedLanguages: string[];
    public unusedLanguages: string[];

    public newTranslationLanguage: string = '';


    public isDeleteButtonVisible = (languageCode: string) => !this.defaultTranslations[languageCode]
        && !this.projectLanguages.includes(languageCode);

    public isRestoreButtonVisible = (languageCode: string) => this.defaultTranslations[languageCode]
        && this.translations[languageCode] !== this.defaultTranslations[languageCode];


    ngOnChanges() {

        this.languages = Languages.getAvailableLanguages();
        if (this.projectLanguages) this.addEmptyValuesForProjectLanguages();
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
        this.unusedLanguages = this.getUnusedLanguages();
    }


    private addEmptyValuesForProjectLanguages() {

        this.projectLanguages.forEach(projectLanguage => {
            if (!this.translations[projectLanguage]) {
                this.translations[projectLanguage] = '';
            }
        });
    }


    private getUnusedLanguages(): string[] {

        const unusedLanguages: string[] = subtract(this.usedLanguages)(Object.keys(this.languages));

        return Languages.getSortedLanguageCodes(this.languages)
            .filter(languageCode => unusedLanguages.includes(languageCode));
    }
}
