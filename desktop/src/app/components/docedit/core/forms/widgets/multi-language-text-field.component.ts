import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges,
    ViewChild } from '@angular/core';
import { clone, isEmpty, isString } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Language } from '../../../../../services/languages';
import { ComponentHelpers } from '../../../../component-helpers';


@Component({
    selector: 'multi-language-text-field',
    templateUrl: './multi-language-text-field.html',
    host: {
        '(window:mousedown)': 'onMouseDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class MultiLanguageTextFieldComponent implements OnChanges {

    @Input() fieldData: I18N.String|string|undefined;
    @Input() languages: Array<Language>;
    @Input() multiLine: boolean = false;

    @Output() onFieldDataChanged: EventEmitter<I18N.String|string|undefined>
        = new EventEmitter<I18N.String|string|undefined>();

    @ViewChild('multiLanguageTextField') multiLanguageTextFieldElement: ElementRef;
    @ViewChild('inputField') inputFieldElement: ElementRef;
    @ViewChild('tabs') tabsElement: ElementRef;

    public tabLanguages: Array<Language>;
    public additionalLanguages: Array<Language>;

    public multiLanguageText: I18N.String|string|undefined;
    public selectedLanguage: string;
    public selectedText: string;
    public shownAdditionalLanguage: Language|undefined;
    public focused: boolean = false;


    public isFilledIn = (languageCode: string) => this.multiLanguageText?.[languageCode] !== undefined;

    public hasTabs = () => this.languages.length > 1
        || (this.languages.length === 1 && this.languages[0].code !== I18N.UNSPECIFIED_LANGUAGE);


    ngOnChanges(changes: SimpleChanges) {

        if (changes['languages']) {
            this.tabLanguages = this.languages.length > 5 ? this.languages.slice(0, 4) : this.languages;
            this.additionalLanguages = this.languages.length > 5 ? this.languages.slice(4) : [];
            if (this.additionalLanguages.length > 0) this.shownAdditionalLanguage = this.additionalLanguages[0];
        }

        this.multiLanguageText = this.readFieldData();
        if (!this.selectedLanguage) this.selectedLanguage = this.languages[0]?.code ?? I18N.UNSPECIFIED_LANGUAGE;
        this.updateSelectedText();
    }


    public onChanges(value: string) {

        this.updateMultiLanguageText(value);
        this.onFieldDataChanged.emit(this.multiLanguageText);
    }


    public onBlur() {

        const trimmedText: string = this.selectedText.trim();
        
        if (this.selectedText !== trimmedText) {
            this.onChanges(this.selectedText);
        }
    }


    public selectLanguage(language: Language) {

        if (this.additionalLanguages.includes(language)) this.shownAdditionalLanguage = language;
        this.selectedLanguage = language.code;
        this.updateSelectedText();
        this.inputFieldElement.nativeElement.focus();
    }


    public onMouseDown(event: any) {

        if (this.tabsElement && event.target === this.tabsElement.nativeElement
            || !ComponentHelpers.isInside(
                event.target,
                target => target === this.multiLanguageTextFieldElement.nativeElement
            )
        ) {
            this.focused = false;
        }
    }


    public onKeyDown(event: KeyboardEvent) {

        if (!['Tab', 'Escape'].includes(event.key)) return;

        setTimeout(() => {
            if (!ComponentHelpers.isInside(
                document.activeElement,
                target => target === this.multiLanguageTextFieldElement.nativeElement
            )) {
                this.focused = false;
            };
        });
    }


    private readFieldData(): I18N.String|string|undefined {

        if (isString(this.fieldData)) {
            if (this.hasNoConfiguredLanguages()) {
                return this.fieldData;
            } else {
                const result: I18N.String = {};
                result[I18N.UNSPECIFIED_LANGUAGE] = this.fieldData;
                return result;
            }
        } else if (this.fieldData) {
            return clone(this.fieldData);
        } else {
            return undefined;
        }
    }


    private updateSelectedText() {

        this.selectedText = this.multiLanguageText
            ? isString(this.multiLanguageText)
                ? this.multiLanguageText
                : this.multiLanguageText[this.selectedLanguage] ?? ''
            : '';
    }


    private updateMultiLanguageText(value: string) {

        if ((this.multiLanguageText && isString(this.multiLanguageText)) || this.hasNoConfiguredLanguages()) {
            this.multiLanguageText = value;
        } else if (value === '') {
            if (this.multiLanguageText) {
                delete this.multiLanguageText[this.selectedLanguage];
                if (isEmpty(this.multiLanguageText)) this.multiLanguageText = undefined;
            }
        } else {
            if (!this.multiLanguageText) this.multiLanguageText = {};
            this.multiLanguageText[this.selectedLanguage] = value;
        }
    }


    private hasNoConfiguredLanguages(): boolean {

        return this.languages.length === 1 && this.languages[0].code === I18N.UNSPECIFIED_LANGUAGE;
    }
}
