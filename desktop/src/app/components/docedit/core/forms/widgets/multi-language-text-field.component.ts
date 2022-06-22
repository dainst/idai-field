import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { clone, isEmpty, isString } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Language } from '../../../../../services/languages';


@Component({
    selector: 'multi-language-text-field',
    templateUrl: './multi-language-text-field.html'
})

/**
 * @author Thomas Kleinke
 */
export class MultiLanguageTextFieldComponent implements OnChanges {

    @Input() fieldData: I18N.String|undefined;
    @Input() languages: { [languageCode: string]: Language };

    @Output() onFieldDataChanged: EventEmitter<I18N.String|undefined> = new EventEmitter<I18N.String|undefined>();

    public multiLanguageText: I18N.String|undefined;
    public configuredLanguages: string[] = ['de', 'en', 'it'];
    public selectedLanguage: string;
    public selectedText: string;


    public getLanguageLabel = (languageCode: string) => this.languages[languageCode].label;


    ngOnChanges() {

        this.multiLanguageText = this.readFieldData();
        this.selectedLanguage = this.multiLanguageText
            ? Object.keys(this.multiLanguageText)[0] ?? I18N.NO_LANGUAGE
            : I18N.NO_LANGUAGE;
        this.updateSelectedText();
    }


    public onChanges(value: string) {

        this.updateMultiLanguageText(value);
        this.onFieldDataChanged.emit(this.multiLanguageText);
    }


    public selectLanguage(language: string) {

        this.selectedLanguage = language;
        this.updateSelectedText();
    }


    private readFieldData(): I18N.String|undefined {

        if (isString(this.fieldData)) {
            const result: I18N.String = {};
            result[I18N.NO_LANGUAGE] = this.fieldData;
            return result;
        } else if (this.fieldData) {
            return clone(this.fieldData);
        } else {
            return undefined;
        }
    }


    private updateSelectedText() {

        this.selectedText = this.multiLanguageText
            ? this.multiLanguageText[this.selectedLanguage] ?? ''
            : '';
    }


    private updateMultiLanguageText(value: string) {

        if (value === '') {
            delete this.multiLanguageText[this.selectedLanguage];
            if (isEmpty(this.multiLanguageText)) this.multiLanguageText = undefined;
        } else {
            if (!this.multiLanguageText) this.multiLanguageText = {};
            this.multiLanguageText[this.selectedLanguage] = value;
        }
    }
}
