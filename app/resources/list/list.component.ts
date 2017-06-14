import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {PersistenceManager} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {M} from '../../m';
import {SettingsService} from '../../settings/settings-service';
import {EditModalComponent} from '../../widgets/edit-modal.component';
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
            let relations = [];
            let rawRelations = this.projectConfiguration.getRelationDefinitions(typeKey);
            for(let rel of rawRelations) {
                if (rel['visible'] != false) {
                    for(let target of rel['range']) {
                        relations.push({name: rel['name'], targetName: target, label: rel['label']});
                    }
                }
            }
            this.typesMap[typeKey]['relations'] = relations;
        }
    }

    public save(document: IdaiFieldDocument){

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.persistenceManager.persist(document, this.settingsService.getUsername(), [oldVersion]).then(
            doc => this.messages.add([M.WIDGETS_SAVE_SUCCESS]),
            msgWithParams => this.messages.add(msgWithParams)
        );
    }

    public focusDocument(doc: IdaiFieldDocument) {

        this.detailedDocument = doc;

        let detailModal
            = this.modalService.open(EditModalComponent, {size: 'lg', backdrop: 'static'}).componentInstance;
        detailModal.setDocument(doc);
    }

    public addRelatedDocument(parentDocument: IdaiFieldDocument, relation, event) {

        if (!parentDocument || !relation) return;

        event.target.value = '';

        let newDoc: IdaiFieldDocument
            = <IdaiFieldDocument> {'resource': { 'relations': {}, 'type': relation['targetName'] }, synced: 0 };

        let inverseRelationName = this.projectConfiguration.getInverseRelations(relation['name']);
        newDoc.resource.relations[inverseRelationName] = [parentDocument.resource.id];

        this.persistenceManager.persist(newDoc, this.settingsService.getUsername(), []).then(
            () => {
                this.documents.push(newDoc);
                this.detailedDocument = newDoc;
                this.messages.add([M.WIDGETS_SAVE_SUCCESS]);
            }, msgWithParams => this.messages.add(msgWithParams)
        );
    }
}