import {Component, Output, OnInit, EventEmitter} from '@angular/core';
import {ActivatedRoute,Params,Router} from '@angular/router';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {IdaiFieldResource} from '../model/idai-field-resource';
import {ConfigLoader} from "../../node_modules/idai-components-2/idai-components-2";
import {ProjectConfiguration, RelationsConfiguration} from "../../node_modules/idai-components-2/idai-components-2";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";


@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-view.html'
})

/**
 * @author Thomas Kleinke
 */
export class DocumentViewComponent implements OnInit {

    private document: any;
    @Output() documentSelection: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();


    private type: string;
    private fields: Array<any>;
    private relations: Array<any>;

    private projectConfiguration: ProjectConfiguration;
    private relationsConfiguration: RelationsConfiguration;

    constructor(
        private configLoader: ConfigLoader,
        private datastore: IndexeddbDatastore,
        private route: ActivatedRoute,
        private router: Router)
    {


        this.configLoader.configuration().subscribe((result)=>{
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
                this.relationsConfiguration = result.relationsConfiguration;
            } else {
                // TODO Meldung geben/zeigen wenn es ein Problem mit der Configration gibt
                //this.messages.add(result.error.msgkey);
            }
        });


        // this.datastore.documentChangesNotifications().subscribe(document=>{
        //
        //     console.log("fetched a doc from datastore",document)
        //
        //     this.route.params.forEach((params: Params) => {
        //
        //         if (params['id'] == document.resource['id'])
        //         {
        //             this.datastore.get(params['id']).then(document=> {
        //
        //                 this.document = document;
        //
        //                 this.fields = [];
        //                 this.relations = [];
        //
        //                 if (!this.document) return;
        //
        //                 var resource:IdaiFieldResource = this.document.resource;
        //
        //                 this.type = this.projectConfiguration.getLabelForType(this.document.resource.type);
        //                 this.initializeFields(resource);
        //                 this.initializeRelations(resource);
        //             })
        //         }
        //     });
        // });
        // TODO make it happen on every route change and clean up

        console.log("constructor document view")


    }


    ngOnInit() {
        console.debug("ngoninit document view")

        this.route.params.forEach((params: Params) => {


            this.datastore.get(params['id']).then(document=> {

                this.document = document;

                this.fields = [];
                this.relations = [];

                if (!this.document) return;

                var resource:IdaiFieldResource = this.document.resource;

                this.type = this.projectConfiguration.getLabelForType(this.document.resource.type);
                this.initializeFields(resource);
                this.initializeRelations(resource);

            })
        });
    }




    public selectDocument(document) {
        
        this.documentSelection.emit(document);
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