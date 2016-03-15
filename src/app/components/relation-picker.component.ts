import {Component, Input, OnChanges, ElementRef} from 'angular2/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';


/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 */
@Component({

    selector: 'relation-picker',
    templateUrl: 'templates/relation-picker.html',
    directives: [CORE_DIRECTIVES, COMMON_DIRECTIVES, FORM_DIRECTIVES]
})

export class RelationPickerComponent implements OnChanges {

    @Input() object: IdaiFieldObject;
    @Input() field: any;
    @Input() relationIndex: number;
    @Input() parent: any;

    private suggestions: IdaiFieldObject[];
    private selectedSuggestionIndex: number = -1;
    private selectedTarget: IdaiFieldObject;
    private idSearchString: string;
    private suggestionsVisible: boolean;

    constructor(private element: ElementRef, private datastore: Datastore) {}

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
    private checkSuggestion(object: IdaiFieldObject) {

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
    public chooseTarget(target: IdaiFieldObject) {

        this.createInverseRelation(target);
        this.object[this.field.field][this.relationIndex] = target.id;
        this.selectedTarget = target;
        this.idSearchString = "";
        this.suggestions = []
        this.object.changed = true;
        this.parent.parent.save();
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
            this.parent.deleteRelation(this.relationIndex);
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
                    this.chooseTarget(this.suggestions[this.selectedSuggestionIndex]);
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

    private createInverseRelation(target: IdaiFieldObject) {

        if (!target[this.field.inverse]) {
            target[this.field.inverse] = [];
        }

        target[this.field.inverse].push(this.object.id);
        target.changed = true;
    }

}