import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {PersistenceManager} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {M} from '../m';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {EditModalComponent} from './edit-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})

export class ListComponent {
    @Input() documents: IdaiFieldDocument[];

    private detailedDocument: IdaiFieldDocument;

    public typesMap: { [type: string]: IdaiType };
    public typesList: IdaiType[];

    private projectConfiguration: ProjectConfiguration;


    constructor(
        private messages: Messages,
        private datastore: IdaiFieldDatastore,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        configLoader: ConfigLoader
    ) {

        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.projectConfiguration = projectConfiguration;
            this.initializeTypesList();
            this.addRelationsToTypesMap();
        });

    }

    private initializeTypesList() {
        let list = this.projectConfiguration.getTypesList();
        this.typesList = [];
        for (var type of list) {
            this.typesList.push(type);
        }
    }

    public addRelationsToTypesMap() {
        this.typesMap = this.projectConfiguration.getTypesMap();

        for (let typeKey of Object.keys(this.typesMap)) {
            var relations = []
            let rawRelations = this.projectConfiguration.getRelationDefinitions(typeKey);
            for(let rel of rawRelations) {
                if (rel["visible"] != false) {
                    for(let target of rel["range"]) {
                        relations.push({name: rel["name"], targetName: target, label: rel["label"]})
                    }
                }
            }
            this.typesMap[typeKey]["relations"] = relations;
        }
    }

    public save(document: IdaiFieldDocument) : Promise<any> {
        if (document.resource.id) {
            return this.datastore.update(document).then(
                doc => {
                    this.messages.add([M.WIDGETS_SAVE_SUCCESS]);
                    return Promise.resolve(<IdaiFieldDocument>doc);
                })
                .catch(errorWithParams => {
                    // TODO replace with msg from M
                    this.messages.add(errorWithParams);
                    return Promise.reject([errorWithParams])
                });
        } else {
            return this.datastore.create(document).then(
                doc => {
                    this.messages.add([M.WIDGETS_SAVE_SUCCESS]);
                    return Promise.resolve(doc);
                })
                .catch(errorWithParams => {
                    // TODO replace with msg from M
                    this.messages.add(errorWithParams);
                    return Promise.reject([errorWithParams])
                });
        }

    }

    public focusDocument(doc: IdaiFieldDocument) {
        this.detailedDocument = doc;

        var detailModal = this.modalService.open(EditModalComponent,{size: "lg", backdrop: "static"}).componentInstance
        detailModal.setDocument(doc);
    }


    public addDocument(new_doc_type): IdaiFieldDocument {
        // TODO - Use Validator class
        if (!new_doc_type || new_doc_type == '') {
            return
        }

        let newDoc = <IdaiFieldDocument> { "resource": { "relations": {}, "type": new_doc_type }, synced: 0 };

        this.documents.push(newDoc);
        return newDoc;
    }

    public addRelatedDocument(parentDocument: IdaiFieldDocument, relation, event) {
        if (!parentDocument || !relation) {
            return
        }

        event.target.value = "";

        let newDoc = this.addDocument(relation["targetName"]);

        this.save(newDoc).then(doc => {

            if (!parentDocument.resource.relations[relation["name"]]) {
                parentDocument.resource.relations[relation["name"]] = [];
            }
            parentDocument.resource.relations[relation["name"]].push(doc.resource.id);

            var oldVersion = JSON.parse(JSON.stringify(parentDocument));
            this.persistenceManager.persist(parentDocument, this.settingsService.getUsername(),
                [oldVersion]).then(doc => {
                this.detailedDocument = newDoc;
            });
        })

    }

}