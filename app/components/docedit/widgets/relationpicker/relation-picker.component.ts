import {Component, ElementRef, Input, OnChanges} from '@angular/core';
import {isNot, undefinedOrEmpty} from 'tsfun';
import {Document, Resource, ReadDatastore} from 'idai-components-2';
import {getSuggestions} from '../../../../core/docedit/get-suggestions';
import {RelationDefinition} from '../../../../core/configuration/model/relation-definition';


@Component({
    moduleId: module.id,
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
    
    @Input() relationDefinition: RelationDefinition;
    @Input() relationIndex: number;
    @Input() primary: string;

    public disabled: boolean = false;
    public suggestions: Array<Document>;
    public selectedSuggestionIndex: number = -1;
    public selectedTarget: Document|undefined;
    public idSearchString: string;
    public suggestionsVisible: boolean;

    // This is to compensate for an issue where it is possible
    // to call updateSuggestions repeatedly in short time.
    // It is intended to be only used as guard in updateSuggestions.
    private updateSuggestionsMode: boolean = false;


    constructor(private element: ElementRef,
                private datastore: ReadDatastore) {}


    public async ngOnChanges() {

        this.suggestions = [];
        this.idSearchString = '';
        this.selectedTarget = undefined;

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();

        if (isNot(undefinedOrEmpty)(relationTargetIdentifier)) {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                this.disabled = true;
                console.error(err);
            }
        } else {
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

        this.resource.relations[this.relationDefinition.name][this.relationIndex] = document.resource.id;
        this.selectedTarget = document;
        this.idSearchString = '';
        this.suggestions = [];
    }


    public editTarget() {

        if (!this.selectedTarget) return;

        this.idSearchString = (this.selectedTarget).resource[this.primary];
        this.suggestions = [this.selectedTarget];
        this.selectedSuggestionIndex = 0;
        this.selectedTarget = undefined;

        setTimeout(this.focusInputField.bind(this), 100);
    }


    public enterSuggestionMode() {

        this.suggestionsVisible = true;
    }


    public async leaveSuggestionMode() {

        const relationTargetIdentifier: string = this.getRelationTargetIdentifier();
        if (!relationTargetIdentifier || relationTargetIdentifier === '') return this.deleteRelation();

        this.suggestionsVisible = false;

        if (!this.selectedTarget && relationTargetIdentifier && relationTargetIdentifier !== '') {
            try {
                this.selectedTarget = await this.datastore.get(relationTargetIdentifier);
            } catch (err) {
                console.error(err);
            }
        }
    }


    public focusInputField() {

        let elements = this.element.nativeElement.getElementsByTagName('input');

        if (elements.length == 1) {
            elements.item(0).focus();
        }
    }


    public deleteRelation() {

        this.resource.relations[this.relationDefinition.name].splice(this.relationIndex, 1);

        if (this.resource.relations[this.relationDefinition.name].length === 0) {
            delete this.resource.relations[this.relationDefinition.name];
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
            this.suggestions = await getSuggestions(
                this.datastore, this.resource, this.relationDefinition, this.idSearchString
            );
        } catch (err) {
            console.error(err);
        } finally {
            this.updateSuggestionsMode = false;
        }
    }


    private getRelationTargetIdentifier(): string {

        return this.resource.relations[this.relationDefinition.name][this.relationIndex];
    }
}