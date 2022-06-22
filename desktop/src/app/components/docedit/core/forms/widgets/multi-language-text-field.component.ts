import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
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
    @Input() languages: Array<Language>;

    @Output() onFieldDataChanged: EventEmitter<I18N.String|undefined> = new EventEmitter<I18N.String|undefined>();

    @ViewChild('inputField') inputFieldElement: ElementRef;

    public multiLanguageText: I18N.String|undefined;
    public selectedLanguage: string;
    public selectedText: string;
    public focused: boolean = false;


    public isFilledIn = (languageCode: string) => this.multiLanguageText?.[languageCode] !== undefined;


    ngOnChanges() {

        this.multiLanguageText = this.readFieldData();
        if (!this.selectedLanguage) this.selectedLanguage = this.languages[0].code;
        this.updateSelectedText();
    }


    public onChanges(value: string) {

        this.updateMultiLanguageText(value);
        this.onFieldDataChanged.emit(this.multiLanguageText);
    }


    public selectLanguage(language: string) {

        this.selectedLanguage = language;
        this.updateSelectedText();
        this.inputFieldElement.nativeElement.focus();
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
