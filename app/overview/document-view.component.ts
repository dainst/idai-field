import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {
    ProjectConfiguration,
    RelationsConfiguration,
    ReadDatastore
} from "idai-components-2/idai-components-2";


@Component({
    selector: 'document-view',
    moduleId: module.id,
    templateUrl: './document-view.html'
})

/**
 * @author Thomas Kleinke
 */
export class DocumentViewComponent implements OnChanges {

    @Input() document: any;

    private fields: Array<any>;
    private relations: Array<any>;

    @Input() private projectConfiguration: ProjectConfiguration;
    @Input() private relationsConfiguration: RelationsConfiguration;

    constructor(
        private datastore: ReadDatastore,
        private router: Router)
    {}

    ngOnChanges() {

        if (!this.document) return;

        this.fields = [];
        this.relations = [];

        var resource:IdaiFieldResource = this.document.resource;

        this.initializeFields(resource);
        this.initializeRelations(resource);

    }


    public selectDocument(documentToJumpTo) {
        this.router.navigate(['resources',documentToJumpTo.resource.id])
    }

    private initializeFields(resource: IdaiFieldResource) {
        
        const ignoredFields: Array<string> = [ "id", "identifier", "shortDescription", "type", "relations", "geometries" ];

        for (var fieldName in resource) {
            if (resource.hasOwnProperty(fieldName) && ignoredFields.indexOf(fieldName) == -1) {
                this.fields.push({
                    name: this.getFieldLabel(resource.type, fieldName),
                    value: resource[fieldName],
                    isArray: Array.isArray(resource[fieldName])
                });
            }
        }
    }

    private initializeRelations(resource: IdaiFieldResource) {

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

    private getFieldLabel(type: string, fieldName: string) {

        var fields = this.projectConfiguration.getFields(type);
        return this.getLabel(fieldName, fields);
    }

    private getRelationLabel(relationName: string) {

        var relationFields = this.relationsConfiguration.getRelationFields();
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