import {Component} from "@angular/core";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Query} from "idai-components-2/datastore";
import {ConfigLoader, IdaiType, ProjectConfiguration} from "idai-components-2/configuration";
import {PersistenceManager} from "idai-components-2/persist";
import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

@Component({
    moduleId: module.id,
    templateUrl: './list.html'
})

export class ListComponent {

    private current_document: IdaiFieldDocument;
    public documents: IdaiFieldDocument[];
    public trenches: IdaiFieldDocument[];
    public selectedFilterTrenchId = "";
    public selectedDocument: IdaiFieldDocument;
    private typesList: IdaiType[];
    protected query: Query = {q: '', type: 'resource', prefix: true};

    constructor(
        private messages: Messages,
        private datastore: IdaiFieldDatastore,
        configLoader: ConfigLoader,
        private persistenceManager: PersistenceManager
    ) {
        this.fetchDocuments();
        this.fetchTrenches();
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.initializeTypesTreeList(projectConfiguration);
        });
    }

    public update(document: IdaiFieldDocument): void {

        this.current_document = document;
        this.datastore.update(document).then(
            doc => {
                this.messages.add([M.WIDGETS_SAVE_SUCCESS]);
            })
            .catch(errorWithParams => {
                // TODO replace with msg from M
                this.messages.add(errorWithParams);
            });
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query = this.query) {
        this.datastore.find(query).then(documents => {
            this.documents = documents as IdaiFieldDocument[];

        }).catch(err => { console.error(err); } );
    }

    private fetchTrenches() {
        this.datastore.findByType('trench').then(documents => {
            this.trenches = documents as IdaiFieldDocument[];
        }).catch(err => { console.error(err); } );
    }

    public filterByTrench() {
        if (this.selectedFilterTrenchId == "") {
            this.fetchDocuments();
        } else {
            var filterby = this.selectedFilterTrenchId;
            this.documents = this.documents.filter(function (doc: IdaiFieldDocument) {

                if (doc.resource.relations['belongsTo'] != undefined) {
                    if (doc.resource.relations['belongsTo'].indexOf(filterby) != -1) {
                        return true;
                    }
                }
            })
        }
    }

    private initializeTypesTreeList(projectConfiguration: ProjectConfiguration) {
        this.typesList = [];

        for (var type of projectConfiguration.getTypesList()) {
            if (type.name != "image") {
                this.typesList.push(type);
            }
        }
    }

    public select(documentToSelect: IdaiFieldDocument) {
       this.selectedDocument = documentToSelect;
    }

    public queryChanged(query: Query) {
        this.query = query;
        this.fetchDocuments(query);
    }


}