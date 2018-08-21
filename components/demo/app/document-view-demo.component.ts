import {Component, OnInit} from '@angular/core';
import {FieldDefinition} from '../../src/core/configuration/field-definition';
import {IdaiType} from '../../src/core/configuration/idai-type';
import {Datastore} from '../../src/core/datastore/datastore';
import {Document} from '../../src/core/model/document';
import {ProjectConfiguration} from '../../src/core/configuration/project-configuration';

@Component({
    selector: 'document-edit-demo',
    templateUrl: 'demo/app/document-view-demo.html'
})
export class DocumentViewDemoComponent implements OnInit {

    public documents: Array<Document> = [];
    private selectedDocument: Document|undefined;
    public fieldDefinitions: Array<FieldDefinition>;

    public types: IdaiType[];


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: Datastore) {
    }


    ngOnInit() {

        this.types = this.projectConfiguration.getTypesTreeList();
        this.datastore.find({q:''}).then(result => this.documents = result.documents);
    }


    public clicked(id: string) {

        this.changeTo(id);
    }


    public deselect() {

        this.selectedDocument = undefined;
    }


    public showRelationTargetClickedMessage(relationTarget: Document) {

        alert('Relation-Target ausgewählt: ' + relationTarget.resource.identifier);
    }


    private changeTo(id: string) {

        this.datastore.get(id).then(document => {
            this.selectedDocument = JSON.parse(JSON.stringify(document));
            this.fieldDefinitions = this.projectConfiguration.getFieldDefinitions((this.selectedDocument as any).resource.type);
        });
    }
}