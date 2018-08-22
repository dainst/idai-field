import {Component, Input, OnChanges, ElementRef} from '@angular/core';
import {Document} from 'idai-components-2';
import {Query} from 'idai-components-2';
import {Resource} from 'idai-components-2';
import {ReadDatastore} from 'idai-components-2';
import {RelationDefinition} from 'idai-components-2';
import {take, filter, flow, isNot, on} from 'tsfun';
import {Suggestions} from './suggestions';


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

    private static MAX_SUGGESTIONS = 5;

    @Input() document: any;
    
    @Input() relationDefinition: any;
    @Input() relationIndex: number;
    @Input() primary: string;

    public resource: Resource;
    public relations: any;

    private suggestions: Document[];
    private selectedSuggestionIndex: number = -1;
    private selectedTarget: Document|undefined;
    private idSearchString: string;
    private suggestionsVisible: boolean;

    private disabled: boolean = false;

    // This is to compensate for an issue where it is possible
    // to call updateSuggestions repeatedly in short time.
    // It is intended to be only used as guard in updateSuggestions.
    private updateSuggestionsMode = false;


    constructor(private element: ElementRef, private datastore: ReadDatastore) {}


    public async ngOnChanges() {

        if (this.document) {
            this.resource = this.document.resource;
            this.relations = this.resource.relations;
        }

        this.suggestions = [];
        this.idSearchString = '';
        this.selectedTarget = undefined;

        const relationId: string = this.relations[this.relationDefinition.name][this.relationIndex];


        if (relationId && relationId !== '') {

            // See #8992
            await this.deleteLiesWithinConditionally(relationId);

            this.datastore.get(relationId).then(
                document => { this.selectedTarget = document as Document; },
                err => { this.disabled = true; console.error(err); }
            );

        } else {
            setTimeout(() => {
                (this.updateSuggestions() as any).then(() => {
                    return this.focusInputField();
                })
            }, 100);
        }
    }


    /**
     * Creates a relation to the target object.
     * @param document
     */
    public createRelation(document: Document) {

        this.relations[this.relationDefinition.name][this.relationIndex] =
            document.resource.id;
        this.selectedTarget = document;
        this.idSearchString = '';
        this.suggestions = [];
    }


    public editTarget() {

        this.idSearchString = (this.selectedTarget as any).resource[this.primary];
        this.suggestions = [ this.selectedTarget ] as any;
        this.selectedSuggestionIndex = 0;
        this.selectedTarget = undefined;

        setTimeout(this.focusInputField.bind(this), 100);
    }


    public enterSuggestionMode() {

        this.suggestionsVisible = true;
    }


    public leaveSuggestionMode() {

        if (!this.relations[this.relationDefinition.name][this.relationIndex]
            || this.relations[this.relationDefinition.name][this.relationIndex] == '') {
            return this.deleteRelation();
        }

        this.suggestionsVisible = false;

        if (!this.selectedTarget && this.relations[this.relationDefinition.name][this.relationIndex]
            && this.relations[this.relationDefinition.name][this.relationIndex] != '') {
            this.datastore.get(this.relations[this.relationDefinition.name][this.relationIndex])
                .then(
                    document => { this.selectedTarget = document as Document; },
                    err => { console.error(err); }
                );
        }
    }


    public focusInputField() {

        let elements = this.element.nativeElement.getElementsByTagName('input');

        if (elements.length == 1) {
            elements.item(0).focus();
        }
    }


    public deleteRelation(): Promise<any> {

        let targetId = this.relations[this.relationDefinition.name][this.relationIndex];

        return new Promise<any>((resolve) => {
            if (targetId.length == 0) {
                this.relations[this.relationDefinition.name].splice(this.relationIndex, 1);
            } else {
                this.relations[this.relationDefinition.name].splice(this.relationIndex, 1);
            }

            if (this.relations[this.relationDefinition.name].length==0)
                delete this.relations[this.relationDefinition.name];
            resolve();
        });
    }


    public keyDown(event: any) {

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
                if (this.selectedSuggestionIndex > -1 && this.suggestions.length > 0)
                    this.createRelation(this.suggestions[this.selectedSuggestionIndex]);
                break;
        }
    }


    public keyUp(event: any) {

        switch(event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Enter':
                break;
            default:
                this.selectedSuggestionIndex = 0;
                setTimeout(() => {
                    return this.updateSuggestions()}
                , 100);
                // This is to compensate for
                // a slight delay where idSearchString takes some time to get updated. The behaviour
                // was discovered on an ocasion where the search string got pasted into the input field.
                // If one does the keyup quickly after pasting, it wasn't working. If One leaves the command
                // key somewhat later, it worked.
                break;
        }
    }

    private async deleteLiesWithinConditionally(relationId?: string) {

        if (this.relationDefinition.name === 'isRecordedIn'
            && this.resource.relations['liesWithin']
            && this.resource.relations['liesWithin'].length > 0) {

            const liesWithinTarget =
                await this.datastore.get(this.document.resource.relations['liesWithin'][0]);

            if (liesWithinTarget) {
                if (liesWithinTarget.resource.relations['isRecordedIn']
                    && liesWithinTarget.resource.relations['isRecordedIn'].length > 0) {

                    if (liesWithinTarget.resource.relations['isRecordedIn'][0] !== relationId) {
                        this.document.resource.relations['liesWithin'] = []
                    }
                }
            }
        }
    }


    private updateSuggestions() {

        if (this.updateSuggestionsMode) return;
        this.updateSuggestionsMode = true;

        const query: Query = {};
        if (this.idSearchString) {
            query.q = this.idSearchString;
        }

        return this.datastore.find(query)
            .then(result => {
                this.suggestions = Suggestions.makeSuggestionsFrom(
                    result.documents, this.resource,
                    this.relationDefinition, RelationPickerComponent.MAX_SUGGESTIONS);
            }).catch(err => {
                console.debug(err);
            }).then(() => {
                this.updateSuggestionsMode = false;
            });
    }
}