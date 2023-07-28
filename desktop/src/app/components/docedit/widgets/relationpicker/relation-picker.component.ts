import { Component, ElementRef, Input, OnChanges } from '@angular/core';
import { Document, Datastore, Resource, Relation } from 'idai-field-core';
import { RelationPicker } from './relation-picker';


@Component({
    selector: 'relation-picker',
    templateUrl: './relation-picker.html'
})
/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RelationPickerComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() relationDefinition: Relation;
    @Input() relationIndex: number;

    public disabled: boolean = false;
    public suggestions: Array<Document>;
    public selectedSuggestionIndex: number = -1;
    public idSearchString: string;
    public suggestionsVisible: boolean;

    public relationPicker: RelationPicker;

    // This is to compensate for an issue where it is possible
    // to call updateSuggestions repeatedly in short time.
    // It is intended to be only used as guard in updateSuggestions.
    private updateSuggestionsMode: boolean = false;


    constructor(private element: ElementRef,
                private datastore: Datastore) {}


    public deleteRelation = () => this.relationPicker.deleteRelation();


    public async ngOnChanges() {

        this.relationPicker = new RelationPicker(
            this.resource, this.relationDefinition, this.datastore, this.relationIndex
        );

        this.suggestions = [];
        this.idSearchString = '';

        try {
            await this.relationPicker.updateSelectedTarget();
        } catch (err) {
            this.disabled = true;
            console.error(err);
        }

        if (!this.relationPicker.selectedTarget) {
            setTimeout(async () => {
                await this.updateSuggestions();
                this.focusInputField();
            }, 100);
        }
    }


    /**
     * Creates a relation to the target object.
     * @param document
     */
    public createRelation(document: Document) {

        this.relationPicker.createRelation(document);
        this.idSearchString = '';
        this.suggestions = [];
    }


    public editTarget() {

        if (!this.relationPicker.selectedTarget) return;

        this.idSearchString = (this.relationPicker.selectedTarget).resource.identifier;
        this.suggestions = [this.relationPicker.selectedTarget];
        this.selectedSuggestionIndex = 0;
        this.relationPicker.selectedTarget = undefined;

        setTimeout(this.focusInputField.bind(this), 100);
    }


    public enterSuggestionMode() {

        this.suggestionsVisible = true;
    }


    public leaveSuggestionMode() {

        this.suggestionsVisible = false;
        this.relationPicker.leaveSuggestionMode();
    }


    public focusInputField() {

        let elements = this.element.nativeElement.getElementsByTagName('input');

        if (elements.length == 1) {
            elements.item(0).focus();
        }
    }


    public keyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'ArrowUp':
                if (this.selectedSuggestionIndex > 0)
                    this.selectedSuggestionIndex--;
                else
                    this.selectedSuggestionIndex = this.suggestions.length - 1;
                event.preventDefault();
                break;
            case 'ArrowDown':
                if (this.selectedSuggestionIndex < this.suggestions.length - 1)
                    this.selectedSuggestionIndex++;
                else
                    this.selectedSuggestionIndex = 0;
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                break;
            case 'Enter':
                if (this.selectedSuggestionIndex > -1 && this.suggestions.length > 0) {
                    this.createRelation(this.suggestions[this.selectedSuggestionIndex]);
                }
                break;
        }
    }


    public keyUp(event: KeyboardEvent) {

        switch(event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Enter':
                break;
            default:
                this.selectedSuggestionIndex = 0;
                setTimeout(() => this.updateSuggestions(), 100);
                // This is to compensate for
                // a slight delay where idSearchString takes some time to get updated. The behaviour
                // was discovered on an occasion where the search string got pasted into the input field.
                // If one does the keyup quickly after pasting, it wasn't working. If One leaves the command
                // key somewhat later, it worked.
                break;
        }
    }


    private async updateSuggestions() {

        if (this.updateSuggestionsMode) return;
        this.updateSuggestionsMode = true;

        try {
            this.suggestions = await this.relationPicker.getSuggestions(this.idSearchString);
        } catch (err) {
            console.error(err);
        } finally {
            this.updateSuggestionsMode = false;
        }
    }
}
