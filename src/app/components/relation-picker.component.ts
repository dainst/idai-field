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

    suggestions: IdaiFieldObject[];
    selectedTarget: IdaiFieldObject;
    idSearchString: string;
    suggestionsVisible: boolean;

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
        }
    }

    public search() {

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

        this.object[this.field.field][this.relationIndex] = target.id;
        this.selectedTarget = target;
        this.idSearchString = "";
        this.suggestions = [];
        this.parent.triggerAutosave();
    }

    public editTarget() {

        this.idSearchString = this.selectedTarget.identifier;
        this.suggestions = [ this.selectedTarget ];
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

}