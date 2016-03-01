import {Component, Inject, Input, OnChanges} from 'angular2/core';
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {Relation} from "../model/relation";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 */
@Component({

    selector: 'relation-picker',
    templateUrl: 'templates/relation-picker.html'
})

export class RelationPickerComponent implements OnChanges {

    private types: string[] = [
        "Part of",
        "Similar to",
        "Below",
        "Above",
        "Next to"
    ];

    @Input() object: any;
    @Input() parent: any;


    constructor() {

    }


    public ngOnChanges() {

        console.log("changes");

        if (!this.object.relation)
            this.object.relation = new Relation();
    }

    public validateId() {

        /** TODO:
         * Validation
         */


        this.parent.triggerAutosave();
    }
}