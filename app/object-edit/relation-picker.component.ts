import {Component, Input, OnChanges, ElementRef} from '@angular/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "@angular/common";
import {Entity} from "../core-services/entity";
import {PersistenceManager} from "../core-services/persistence-manager";
import {Datastore} from "../core-services/datastore";


/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({

    selector: 'relation-picker',
    templateUrl: 'templates/relation-picker.html',
    directives: [CORE_DIRECTIVES, COMMON_DIRECTIVES, FORM_DIRECTIVES]
})

export class RelationPickerComponent implements OnChanges {

    @Input() object: Entity;
    @Input() field: any;
    @Input() relationIndex: number;

    private suggestions: Entity[];
    private selectedSuggestionIndex: number = -1;
    private selectedTarget: Entity;
    private idSearchString: string;
    private suggestionsVisible: boolean;

    constructor(private element: ElementRef,
        /**
         * In this component the datastore should be used only for read access.
         */
        private datastore: Datastore,
        private persistenceManager: PersistenceManager // TODO instead of this the parent object edit component should get addressed for marking an object as changed
    )
    {}

    public ngOnChanges() {

        this.suggestions = [];
        this.idSearchString = "";
        this.selectedTarget = undefined;

        var relationId: string = this.object[this.field.field][this.relationIndex];

        if (relationId && relationId != "") {
            this.datastore.get(relationId).then(
                object => { this.selectedTarget = object; },
                err => { console.error(err); }
            );
        } else {
            setTimeout(this.focusInputField.bind(this), 100);
        }
    }

    private updateSuggestions() {

        if (this.idSearchString.length > 0) {
            this.datastore.find(this.idSearchString, {})
                .then(objects => {
                    this.suggestions = [];
                    for (var i in objects) {

                        // Show only the first five suggestions
                        if (this.suggestions.length == 5)
                            break;

                        if (this.checkSuggestion(objects[i]))
                            this.suggestions.push(objects[i]);
                    }
                }).catch(err =>
                console.error(err));
        } else
            this.suggestions = [];
    }

    /**
     * Checks if the given object should be shown as a suggestion
     * @param object
     */
    private checkSuggestion(object: Entity) {

        // Don't suggest the object itself
        if (this.object.id == object.id)
            return false;

        // Don't suggest an object that is already included as a target in the relation list
        if (this.object[this.field.field].indexOf(object.id) > -1)
            return false;

        // Don't suggest an object that is already included as a target in the inverse relation list
        if (this.object[this.field.inverse]
                && this.object[this.field.inverse].indexOf(object.id) > -1)
            return false;

        return true;
    }

    /**
     * Creates a relation to the target object.
     * @param target
     */
    public createRelation(target: Entity) {

        // this.createInverseRelation(target);
        this.object[this.field.field][this.relationIndex] = target.id;
        this.selectedTarget = target;
        this.idSearchString = "";
        this.suggestions = [];

        this.persistenceManager.load(this.object);
    }

    public editTarget() {

        this.idSearchString = this.selectedTarget.identifier;
        this.suggestions = [ this.selectedTarget ];
        this.selectedSuggestionIndex = 0;
        this.selectedTarget = undefined;

        setTimeout(this.focusInputField.bind(this), 100);
    }

    public enterSuggestionMode() {

        this.suggestionsVisible = true;
    }

    public leaveSuggestionMode() {

        if (!this.object[this.field.field][this.relationIndex]
                || this.object[this.field.field][this.relationIndex] == "") {
            this.deleteRelation();
        }

        this.suggestionsVisible = false;

        if (!this.selectedTarget && this.object[this.field.field][this.relationIndex]
                                 && this.object[this.field.field][this.relationIndex] != "") {
            this.datastore.get(this.object[this.field.field][this.relationIndex])
                .then(
                    object => { this.selectedTarget = object; },
                    err => { console.error(err); }
                );
        }
    }

    public focusInputField() {

        var elements = this.element.nativeElement.getElementsByTagName("input");

        if (elements.length == 1) {
            elements.item(0).focus();
        }
    }

    public deleteRelation(): Promise<any> {
        var targetId = this.object[this.field.field][this.relationIndex];
        return new Promise<any>((resolve) => {
            if (targetId.length == 0) {
                this.object[this.field.field].splice(this.relationIndex, 1);
            }
            this.persistenceManager.load(this.object);
            resolve();
        });
    }

    public keyDown(event: any) {

        switch(event.keyIdentifier) {
            case "Up":
                if (this.selectedSuggestionIndex > 0)
                    this.selectedSuggestionIndex--;
                else
                    this.selectedSuggestionIndex = this.suggestions.length - 1;
                event.preventDefault();
                break;
            case "Down":
                if (this.selectedSuggestionIndex < this.suggestions.length - 1)
                    this.selectedSuggestionIndex++;
                else
                    this.selectedSuggestionIndex = 0;
                event.preventDefault();
                break;
            case "Left":
            case "Right":
                break;
            case "Enter":
                if (this.selectedSuggestionIndex > -1 && this.suggestions.length > 0)
                    this.createRelation(this.suggestions[this.selectedSuggestionIndex]);
                break;
        }
    }

    public keyUp(event: any) {

        switch(event.keyIdentifier) {
            case "Up":
            case "Down":
            case "Left":
            case "Right":
            case "Enter":
                break;
            default:
                this.selectedSuggestionIndex = 0;
                this.updateSuggestions();
                break;
        }
    }

}