import {Component, Input, OnChanges, ElementRef} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {Query} from 'idai-components-2/core';
import {Resource} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from './document-edit-change-monitor';
import {ReadDatastore} from 'idai-components-2/core';
import {RelationDefinition} from 'idai-components-2/core';


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


    constructor(private element: ElementRef,
        private datastore: ReadDatastore,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {}


    public ngOnChanges() {

        if (this.document) {
            this.resource = this.document.resource;
            this.relations = this.resource.relations;
        }

        this.suggestions = [];
        this.idSearchString = '';
        this.selectedTarget = undefined;

        const relationId: string = this.relations[this.relationDefinition.name][this.relationIndex];

        if (relationId && relationId != '') {
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

        this.documentEditChangeMonitor.setChanged();
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
                this.documentEditChangeMonitor.setChanged();
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


    private updateSuggestions() {

        if (this.updateSuggestionsMode) return;
        this.updateSuggestionsMode = true;

        const query: Query = {};
        if (this.idSearchString) {
            query.q = this.idSearchString;
        }

        return this.datastore.find(query)
            .then(result => {
                this.suggestions = RelationPickerComponent.makeSuggestionsFrom(
                    result.documents, this.resource, this.relationDefinition);
            }).catch(err => {
                console.debug(err);
            }).then(() => {
                this.updateSuggestionsMode = false;
            });
    }


    private static makeSuggestionsFrom(documents: any, resource: any, relationDefinition: any) {

        const suggestions = [] as any;
        const maxNrSuggestions = 5;
        let nrSuggestions = 0;
        for (let document of documents) {

            if (nrSuggestions == maxNrSuggestions) continue;

            if (RelationPickerComponent.isValidSuggestion(resource,
                    document.resource, relationDefinition)) {

                suggestions.push(document as never);
                nrSuggestions++;
            }
        }
        return suggestions;
    }


    /**
     * Checks if the given suggestion should be shown as a suggestion
     * @param resource
     * @param suggestion
     * @param relDef
     * @return true if the suggestion should be suggested, false otherwise
     */
    private static isValidSuggestion(
            resource: Resource, suggestion: Resource,
            relDef: RelationDefinition) {

        // Don't suggest the resource itself
        if (resource.id == suggestion.id) {
            return false;
        }

        // Don't suggest a resource that is already included as a target in the relation list
        if (resource.relations[relDef.name].indexOf(suggestion.id as any) > -1) {
            return false;
        }

        // Don't suggest a resource that is already included as a target in the inverse relation list
        if (resource.relations[relDef.inverse]
                && resource.relations[relDef.inverse].indexOf(suggestion.id as any) > -1) {
            return false;
        }

        // Don't suggest a resource whose type is not a part of the relation's range
        if (relDef.range.indexOf(suggestion.type) == -1) {
            return false;
        }

        // Don't suggest a resource which is linked to a different main type resource if the relation property
        // 'sameMainTypeResource' is set to true
        return !relDef.sameMainTypeResource ||
            RelationPickerComponent.isSameMainTypeResource(
                resource, suggestion);
    }


    private static isSameMainTypeResource(
            resource1: Resource,
            resource2: Resource) {

        const relations1 = resource1.relations['isRecordedIn'];
        const relations2 = resource2.relations['isRecordedIn'];

        if (!relations1 || relations1.length == 0 ||
            !relations2 || relations2.length == 0) return false;

        return relations1[0] == relations2[0];
    }
}