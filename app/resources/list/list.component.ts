import {Component, Input, OnChanges} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from '../resources.component';
import {DocumentReference} from './document-reference';
import {Loading} from '../../widgets/loading';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';
import {MainTypeManager} from '../service/main-type-manager';
import {DocumentsManager} from '../service/documents-manager';
import {ViewManager} from '../service/view-manager';

@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ListComponent implements OnChanges {

    @Input() ready;
    @Input() documents; // TODO this is just for a reload, replace by using an observer to document changes in documentsManager

    public docRefTree: DocumentReference[];

    public typesMap: { [type: string]: IdaiType };

    private childrenShownForIds: string[];
    
    constructor(
        private datastore: IdaiFieldDatastore,
        public resourcesComponent: ResourcesComponent, // TODO remove this, we only use it to access ready which we also have as input
        private messages: Messages,
        private loading: Loading,
        projectConfiguration: ProjectConfiguration,
        public mainTypeManager: MainTypeManager,
        public documentsManager: DocumentsManager,
        public viewManager: ViewManager
    ) {
        this.typesMap = projectConfiguration.getTypesMap();
    }


    ngOnChanges() {

        if (!this.ready) return;

        this.loading.start();

        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.update()
                .catch(msgWithParams => this.messages.add(msgWithParams))
                .then(() => this.loading.stop());
        }, 1);
    }


    private update(): Promise<any> {

        if (!this.mainTypeManager.selectedMainTypeDocument) return Promise.resolve();

        this.docRefTree = [];
        this.childrenShownForIds = [];

        // TODO now that we already have that functionality centralized in a service, here we should work with documentsManager.populateList. get rid of datastore depedency afterwards
        return this.datastore.find(
            { constraints: { 'resource.relations.isRecordedIn': this.mainTypeManager.selectedMainTypeDocument.resource.id } }
        ).then(resultDocs => this.buildTreeFrom(resultDocs));
    }


    private buildTreeFrom(documents: Array<Document>) {

        let docRefMap: {[type: string]: DocumentReference} = {};

        // initialize docRefMap to make sure it is fully populated before building the tree
        for (let doc of documents) {
            let docRef: DocumentReference = { doc: doc, children: [] };
            docRefMap[doc.resource.id] = docRef;
        }

        // build tree from liesWithin relations
        for (let doc of documents) {
            let docRef = docRefMap[doc.resource.id];
            if (!doc.resource.relations['liesWithin']) {
                this.docRefTree.push(docRef);
            } else {
                for (let parentId of doc.resource.relations['liesWithin']) {
                    if (!docRefMap[parentId]) continue;
                    docRefMap[parentId]['children'].push(docRef);
                    docRef['parent'] = docRefMap[parentId];
                }
            }
        }
    }


    public toggleChildrenForId(id: string) {

        let index = this.childrenShownForIds.indexOf(id);
        if (index != -1) {
            this.childrenShownForIds.splice(index, 1);
        } else {
            this.childrenShownForIds.push(id);
        }
    }

    public childrenHiddenFor(id: string) {

        return this.childrenShownForIds.indexOf(id) == -1
    }


    public showRow(docRef: DocumentReference): boolean {

        if (docRef['parent']
                && !this.childrenHiddenFor(docRef['parent'].doc.resource.id)
                && this.isAscendantPartOfResult(docRef))
            return true;
        return this.isDescendantPartOfResult(docRef);
    }


    private isAscendantPartOfResult(docRef: DocumentReference): boolean {

        let parent = docRef['parent'];
        while (parent) {
            if (this.documentsInclude(parent.doc as IdaiFieldDocument))
                return true;
            parent = parent['parent'];
        }
        return false;
    }


    private isDescendantPartOfResult(docRef: DocumentReference): boolean {

        if (this.documentsInclude(docRef.doc as IdaiFieldDocument))
            return true;
        else
            for (let child of docRef['children'])
                if (this.isDescendantPartOfResult(child)) {
                    if (this.childrenHiddenFor(docRef.doc.resource.id))
                        this.toggleChildrenForId(docRef.doc.resource.id);
                    return true;
                }
        return false;
    }


    // TODO move to documentsManager
    private documentsInclude(doc: IdaiFieldDocument): boolean {

        return this.documentsManager.documents.some(d => d.resource.id == doc.resource.id );
    }
}