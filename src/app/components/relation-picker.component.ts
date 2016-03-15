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

    private search() {

        if (this.idSearchString.length > 0) {
            this.datastore.find(this.idSearchString, {})
                .then(objects => {
                    this.suggestions = [];
                    for (var i in objects) {
                        if (this.suggestions.length == 5)
                            break;
                        if (this.object.id != objects[i].id)
                            this.suggestions.push(objects[i]);
                    }
                }).catch(err =>
                console.error(err));
        } else
            this.suggestions = [];
    }

    public chooseTarget(target: IdaiFieldObject) {

        this.createInverseRelation(target);
        this.object[this.field.field][this.relationIndex] = target.id;
        this.selectedTarget = target;
        this.idSearchString = "";
        this.suggestions = []
        this.object.changed = true;
        this.parent.save();
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

        this.suggestionsVisible = false;

        if (!this.selectedTarget && this.object[this.field.field][this.relationIndex]
                                 && this.object[this.field.field][this.relationIndex] != "") {
            this.datastore.get(this.object[this.field.field][this.relationIndex])
                .then(
                    object => { this.selectedTarget = object },
                    err => { console.error(err) }
                );
        }
    }

    public focusInputField() {

        this.element.nativeElement.getElementsByTagName("input").item(0).focus();
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
                this.search();
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