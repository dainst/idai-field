import {Component, Input} from 'angular2/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {IdaiFieldObject} from '../model/idai-field-object';
import {Relation} from "../model/relation";
import {RelationPickerComponent} from "./relation-picker.component";
import {OnChanges} from "angular2/core";


/**
 * @author Thomas Kleinke
 */
@Component({

    selector: 'relation-picker-group',
    templateUrl: 'templates/relation-picker-group.html',
    directives: [CORE_DIRECTIVES, COMMON_DIRECTIVES, FORM_DIRECTIVES, RelationPickerComponent]
})

export class RelationPickerGroupComponent implements OnChanges {

    @Input() object: IdaiFieldObject;
    @Input() parent: any;

    private newRelation: Relation;


    public ngOnChanges() {

        this.newRelation = undefined;
    }

    public createRelation() {

        this.newRelation = new Relation();
        this.object.relations.push(this.newRelation);
    }

    public deleteRelation(relation: Relation) {

        if (this.newRelation == relation)
            this.newRelation = undefined;

        var index = this.object.relations.indexOf(relation);
        this.object.relations.splice(index, 1);

        this.parent.triggerAutosave();
    }

    public validate(relation: Relation): boolean {

        if (!relation)
            return false;

        if (!this.newRelation.relationType || this.newRelation.relationType.length == 0)
            return false;

        if (!this.newRelation.id || this.newRelation.id.length == 0)
            return false;

        return true;
    }

}