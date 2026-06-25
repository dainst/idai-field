import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document, Field } from 'idai-field-core';
import {
    getKoreanFieldworkNarrativeChecklistItems,
    getKoreanFieldworkNarrativeFieldGroups,
    getKoreanFieldworkNarrativeSnippetValue,
    KoreanFieldworkNarrativeChecklistItem,
    KoreanFieldworkNarrativeFieldGroup,
    KoreanFieldworkNarrativeSnippet
} from '../../../util/korean-fieldwork-narrative-assist';


@Component({
    selector: 'korean-fieldwork-narrative-assist-panel',
    templateUrl: './korean-fieldwork-narrative-assist-panel.html',
    standalone: false
})
export class KoreanFieldworkNarrativeAssistPanelComponent {

    @Input() document: Document;
    @Input() fieldDefinitions: Field[];

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();


    public shouldShow = () => this.getFieldGroups().length > 0;


    public getChecklistItems(): KoreanFieldworkNarrativeChecklistItem[] {

        return getKoreanFieldworkNarrativeChecklistItems(this.document, this.fieldDefinitions);
    }


    public hasChecklistItems = () => this.getChecklistItems().length > 0;


    public getFieldGroups(): KoreanFieldworkNarrativeFieldGroup[] {

        return getKoreanFieldworkNarrativeFieldGroups(this.document, this.fieldDefinitions);
    }


    public applySnippet(snippet: KoreanFieldworkNarrativeSnippet) {

        if (!this.document?.resource) return;

        this.document.resource[snippet.target] = getKoreanFieldworkNarrativeSnippetValue(
            this.document,
            snippet
        );
        this.onChanged.emit();
    }
}
