import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Query, ReadDatastore} from 'idai-components-2/datastore';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageTypeUtility} from '../docedit/image-type-utility';
import {ImagesState} from './images-state';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';

@Injectable()
/**
 *
 */
export class DocumentsManager { // TODO make module for imageoverview

    private documents: Array<IdaiFieldImageDocument>;

    // TODO move this to image-grid component
    private resourceIdentifiers: string[] = [];


    constructor(
        public viewFacade: ViewFacade,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState,
        private datastore: ReadDatastore
    ) {
    }


    public getDocuments() {

        return this.documents;
    }


    public cacheIdentifier(document: Document) {

        this.resourceIdentifiers[document.resource.id] =
            document.resource.identifier;
    }


    public remove(document: IdaiFieldImageDocument) {

        this.documents.splice(
            this.documents.indexOf(document), 1);
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        return this.datastore.find(query)
            .catch(errWithParams => {
                console.error('ERROR with find using query', query);
                if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
            }).then(documents => {
                if (!documents || documents.length == 0) return Promise.resolve([]);
                if (['', 'UNLINKED'].indexOf(this.imagesState.getMainTypeDocumentFilterOption()) == -1) {
                    return this.applyLinkFilter(documents);
                } else {
                    return Promise.resolve(documents);
                }
            }).then(filteredDocuments => {
                this.documents = filteredDocuments as Array<IdaiFieldImageDocument>;
                this.cacheIdsOfConnectedResources(this.documents);
            });
    }


    private cacheIdsOfConnectedResources(documents: Array<Document>) {

        for (let doc of documents) {
            if (doc.resource.relations['depicts'] && doc.resource.relations['depicts'].constructor === Array)
                for (let resourceId of doc.resource.relations['depicts']) {
                    this.datastore.get(resourceId).then(result => {
                        this.resourceIdentifiers[resourceId] = result.resource.identifier;
                    });
                }
        }
    }


    /**
     * @param documents Documents with depicts relation
     * @returns Documents which are linked to the main type resource selected in filter box:
     * 1. Documents which are linked to a resource which contains an isRecordedIn relation to the main type resource
     * 2. Documents which are directly linked to the main type resource
     */
    private applyLinkFilter(documents: Array<Document>): Promise<Array<Document>> {

        const documentMap: { [id: string]: Document } = {};
        const promises: Array<Promise<Document>> = [];
        const mainTypeDocumentId: string = this.imagesState.getMainTypeDocumentFilterOption();

        for (let document of documents) {
            documentMap[document.resource.id] = document;
            for (let targetId of document.resource.relations['depicts']) {
                promises.push(this.datastore.get(targetId));
            }
        }

        let targetDocuments: Array<Document>;

        return Promise.all(promises).then(targetDocs => {
            targetDocuments = targetDocs;

            return this.datastore.find({
                q: '',
                constraints: { 'resource.relations.isRecordedIn': mainTypeDocumentId }
            });
        }).then(recordedDocuments => {
            const filteredDocuments: Array<Document> = [];

            for (let targetDocument of targetDocuments) {
                if (recordedDocuments.indexOf(targetDocument) > -1) {
                    for (let imageId of targetDocument.resource.relations['isDepictedIn']) {
                        const imageDocument = documentMap[imageId];
                        if (imageDocument && filteredDocuments.indexOf(imageDocument) == -1) {
                            filteredDocuments.push(imageDocument);
                        }
                    }
                }
            }

            const result: Array<Document> = [];

            for (let document of documents) {
                if (filteredDocuments.indexOf(document) > -1 ||
                    // Add images directly linked to the main type document
                    document.resource.relations['depicts'].indexOf(mainTypeDocumentId) > -1) {
                    result.push(document);
                }
            }

            return Promise.resolve(result);
        });
    }
}