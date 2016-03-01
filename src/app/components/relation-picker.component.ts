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

    suggestions: IdaiFieldObject[];
    idSearchString: string;

    constructor(private datastore: Datastore) {}


    public ngOnChanges() {

        if (!this.object.relation)
            this.object.relation = new Relation();

        this.suggestions = [];
        this.idSearchString = "";
    }

    public search() {

        this.datastore.find(this.idSearchString, {})
            .then(objects => {
                this.suggestions = [];
                for (var i in objects) {
                    if (this.suggestions.length == 5)
                        break;
                    if (this.object != objects[i])
                        this.suggestions.push(objects[i]);
                }
                this.suggestions = objects;
            }).catch(err =>
            console.error(err));
    }

    public chooseId(id: string) {

        this.object.relation.id = id;
        this.parent.triggerAutosave();
    }
}