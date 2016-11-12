import {Component, OnInit, OnChanges, Input, EventEmitter, Output} from "@angular/core";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {ProjectConfiguration, ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";

@Component({
    selector: 'relations-view',
    moduleId: module.id,
    templateUrl: './relations-view.html'
})

/**
 * Shows relations and fields of a document.
 *
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class RelationsViewComponent implements OnInit, OnChanges {

    protected relations: Array<any>;

    protected projectConfiguration: ProjectConfiguration;

    @Input() doc;
    @Output() relationClicked = new EventEmitter();

    constructor(
        private datastore: ReadDatastore,
        private configLoader: ConfigLoader
    ) {
        this.configLoader.configuration().subscribe((result) => {
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
            }
        });
    }

    private init() {
        this.relations = [];
        if (!this.doc) return;
        this.initializeRelations(this.doc.resource);
    }

    ngOnInit() {
        this.init();
    }

    ngOnChanges() {
        this.init();
    }

    private clickRelation(doc) {
        this.relationClicked.emit(doc);
    }

    protected initializeRelations(resource: IdaiFieldResource) {

        for (var relationName in resource.relations) {
            if (resource.relations.hasOwnProperty(relationName)) {
                var relationTargets = resource.relations[relationName];

                var relation = {
                    name: this.getRelationLabel(relationName),
                    targets: []
                };
                this.relations.push(relation);

                this.initializeRelation(relation, relationTargets);
            }
        }
    }

    private initializeRelation(relation: any, targets: Array<string>) {

        for (var i in targets) {
            var targetId = targets[i];
            this.datastore.get(targetId).then(
                targetDocument => {
                    relation.targets.push(targetDocument);
                },
                err => { console.error(err); }
            )
        }
    }

    private getRelationLabel(relationName: string) {

        var relationFields = this.projectConfiguration.getRelationFields();
        return this.getLabel(relationName, relationFields);
    }

    private getLabel(fieldName: string, fields: Array<any>) {

        for (var i in fields) {
            if (fields[i].name == fieldName) {
                if (fields[i].label) {
                    return fields[i].label;
                } else {
                    return fieldName;
                }
            }
        }

        return fieldName;
    }
}