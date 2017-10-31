import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from '../resources.component';
import {DocumentReference} from './document-reference';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {IdaiFieldDocumentDatastore} from "../../../core/datastore/idai-field-document-datastore";

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
    @Input() documents: IdaiFieldDocument[]; // TODO this is just for a reload, replace by using an observer to document changes in documentsManager

    public docRefTree: DocumentReference[];

    public typesMap: { [type: string]: IdaiType };

    private childrenShownForIds: string[];
    
    constructor(
        private datastore: IdaiFieldDocumentDatastore,
        public resourcesComponent: ResourcesComponent,
        private messages: Messages,
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
            this.update()
                .catch(msgWithParams => this.messages.add(msgWithParams))
                .then(() => this.loading.stop());
        }, 1);
    }


    public showPlusButton() {

        if (this.resourcesComponent.ready && !this.loading.showIcons && this.viewFacade.getQuery().q == '') {
            if (this.viewFacade.isInOverview()) return true;
            if (this.viewFacade.getSelectedMainTypeDocument()) return true;
        }

        return false;
    }


    private update(): Promise<any> {

        if (!this.resourcesComponent.getIsRecordedInTarget()) return Promise.resolve();

        this.docRefTree = [];
        this.childrenShownForIds = [];

        // TODO now that we already have that functionality centralized in a service, here we should work with documentsManager.populateList. get rid of datastore depedency afterwards
        return this.datastore.find(
            { constraints: { 'resource.relations.isRecordedIn': (this.resourcesComponent.getIsRecordedInTarget() as any).resource.id } } as any
        ).then(resultDocs => this.buildTreeFrom(resultDocs));
    }


    private buildTreeFrom(documents: Array<IdaiFieldDocument>) {

        let docRefMap: {[type: string]: DocumentReference} = {};

        // initialize docRefMap to make sure it is fully populated before building the tree
        for (let doc of documents) {
            let docRef: DocumentReference = { doc: doc, children: [] };
            docRefMap[doc.resource.id as any] = docRef;
        }

        // build tree from liesWithin relations
        for (let doc of documents) {
            let docRef = docRefMap[doc.resource.id as any];
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
                && !this.childrenHiddenFor((docRef['parent'] as any).doc.resource.id as any)
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
                    if (this.childrenHiddenFor(docRef.doc.resource.id as any))
                        this.toggleChildrenForId(docRef.doc.resource.id as any);
                    return true;
                }
        return false;
    }


    // TODO move to documentsManager
    private documentsInclude(doc: IdaiFieldDocument): boolean {

        return this.viewFacade.getDocuments().some(d => d.resource.id == doc.resource.id );
    }
}