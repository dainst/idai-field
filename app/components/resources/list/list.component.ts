import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {ResourcesComponent} from '../resources.component';
import {DocumentReference} from './document-reference';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {IdaiFieldDocumentDatastore} from '../../../core/datastore/idai-field-document-datastore';

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

    @Input() ready: boolean;
    @Input() documents: IdaiFieldDocument[];

    public docRefTree: DocumentReference[];

    public typesMap: { [type: string]: IdaiType };

    private childrenShownForIds: string[] = [];


    constructor(
        private datastore: IdaiFieldDocumentDatastore,
        public resourcesComponent: ResourcesComponent,
        private loading: Loading,
        projectConfiguration: ProjectConfiguration,
        public viewFacade: ViewFacade
    ) {
        this.typesMap = projectConfiguration.getTypesMap();
    }


    ngOnChanges() {

        if (!this.ready) return;
        this.loading.start();

        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            if (this.viewFacade.getDocuments() && this.viewFacade.getDocuments().length > 0) {

                if (!this.resourcesComponent.getIsRecordedInTarget()) return Promise.resolve(); 
                this.buildTreeFrom(this.viewFacade.getDocuments() as IdaiFieldDocument[], true);
            }
            this.loading.stop();
        }, 1);
    }


    public showPlusButton() {

        if (this.resourcesComponent.ready && !this.loading.showIcons && this.viewFacade.getQuery().q == '') {
            if (this.viewFacade.isInOverview()) return true;
            if (this.viewFacade.getSelectedMainTypeDocument()) return true;
        }

        return false;
    }


    public createNewDocument(newDoc: IdaiFieldDocument) {

        const docs: Array<IdaiFieldDocument> = this.viewFacade.getDocuments() as IdaiFieldDocument[];
        
        for (let doc of docs) {
            if (!doc.resource.id) {
                docs.splice(docs.indexOf(doc),1);
                break;
            }
        }
        docs.push(newDoc);

        // if newDoc as parent, ensure that it's children are shown 
        if (newDoc.resource.relations['liesWithin']) {
            const parentDocId = newDoc.resource.relations['liesWithin'][0];
            if (parentDocId && this.childrenShownForIds.indexOf(parentDocId) == -1) this.childrenShownForIds.push(parentDocId);
        }
        
        this.buildTreeFrom(docs, true);  
    }


    public getMissingParents(docRefMap: {[type: string]: DocumentReference}): Promise<any> {

        const promises: Array<Promise<any>> = [];

        for (let docId in docRefMap) {
            let doc = docRefMap[docId].doc;

            if (!doc.resource.relations['liesWithin'] || doc.resource.relations['liesWithin'].length < 1) continue; 
            for (let parentId of doc.resource.relations['liesWithin']) {
                if (!docRefMap[parentId]) {
                    promises.push(this.datastore.get(parentId).then((pdoc) => {
                        docRefMap[parentId] = { doc: pdoc, children: [] };
                        this.childrenShownForIds.push(parentId);
                        if (pdoc.resource.relations['liesWithin'] && pdoc.resource.relations['liesWithin'].length > 0)
                            promises.push(this.getMissingParents(docRefMap));
                    }));
                }
            }
        }

        return Promise.all(promises);
    }


    public toggleChildrenForId(id: string) {

        const index = this.childrenShownForIds.indexOf(id);
        if (index != -1) {
            this.childrenShownForIds.splice(index, 1);
        } else {
            this.childrenShownForIds.push(id);
        }
    }


    public childrenHiddenFor(id: string): boolean {

        return this.childrenShownForIds.indexOf(id) == -1
    }


    public showRow(docRef: DocumentReference): boolean {

        if (docRef.parent
                && !this.childrenHiddenFor((docRef.parent as any).doc.resource.id as any)
                && this.isAscendantPartOfResult(docRef)) {
            return true;
        }
        return this.isDescendantPartOfResult(docRef);
    }


    private buildTreeFrom(documents: Array<IdaiFieldDocument>, keepShownChildren?: boolean) {

        this.docRefTree = [];
        if (!keepShownChildren) this.childrenShownForIds = [];

        const docRefMap: {[type: string]: DocumentReference} = {};

        // initialize docRefMap to make sure it is fully populated before building the tree
        for (let doc of documents) {
            docRefMap[doc.resource.id as any] = { doc: doc, children: [] };
        }

        this.getMissingParents(docRefMap).then(() =>
            this.buildTreeFromLiesWithinRelations(docRefMap)
        );
    }


    private buildTreeFromLiesWithinRelations(docRefMap: {[type: string]: DocumentReference}) {

        for (let docId in docRefMap) {

            const doc = docRefMap[docId].doc;
            const docRef = docRefMap[doc.resource.id as any];

            if (!doc.resource.relations['liesWithin']) {
                this.docRefTree.push(docRef);
            } else {
                for (let parentId of doc.resource.relations['liesWithin']) {
                    docRefMap[parentId].children.push(docRef);
                    docRef.parent = docRefMap[parentId];
                }
            }
        }
    }


    private isAscendantPartOfResult(docRef: DocumentReference): boolean {

        let parent = docRef.parent;
        while (parent) {
            if (this.documentsInclude(parent.doc as IdaiFieldDocument))
                return true;
            parent = parent.parent;
        }
        return false;
    }


    private isDescendantPartOfResult(docRef: DocumentReference): boolean {

        if (this.documentsInclude(docRef.doc as IdaiFieldDocument) || !docRef.doc.resource.id) return true;

        for (let child of docRef.children) {
            if (this.isDescendantPartOfResult(child)) {
                if (this.childrenHiddenFor(docRef.doc.resource.id as any))
                    this.toggleChildrenForId(docRef.doc.resource.id as any);
                return true;
            }
        }

        return false;
    }


    private documentsInclude(doc: IdaiFieldDocument): boolean {

        return this.viewFacade.getDocuments().some(d => d.resource.id == doc.resource.id );
    }
}