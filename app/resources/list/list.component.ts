import {Component, Input, OnChanges} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from '../resources.component';
import {DocumentReference} from './document-reference';
import {Loading} from '../../widgets/loading';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';

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

    @Input() documents: Array<Document>;
    @Input() selectedMainTypeDocument: IdaiFieldDocument;
    @Input() ready;

    public docRefTree: DocumentReference[];

    public typesMap: { [type: string]: IdaiType };

    private childrenShownForIds: string[];
    
    constructor(
        private datastore: IdaiFieldDatastore,
        public resourcesComponent: ResourcesComponent,
        private messages: Messages,
        private loading: Loading,
        configLoader: ConfigLoader
    ) {
        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.typesMap = projectConfiguration.getTypesMap();
        });
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

        this.docRefTree = [];
        this.childrenShownForIds = [];

        return this.datastore.find(
            { constraints: { 'resource.relations.isRecordedIn': this.selectedMainTypeDocument.resource.id } }
        ).then(resultDocs => this.buildTreeFrom(resultDocs));
    }

    private buildTreeFrom(documents: Array<Document>) {

        let docRefMap: {[type: string]: DocumentReference} = {};

        // initialize docRefMap to make sure it is fully populated before building the tree
        documents.forEach(doc => {
            let docRef: DocumentReference = { doc: doc, children: [] };
            docRefMap[doc.resource.id] = docRef;
        });

        // build tree from liesWithin relations
        documents.forEach(doc => {
            let docRef = docRefMap[doc.resource.id];
            if (!doc.resource.relations['liesWithin']) {
                this.docRefTree.push(docRef);
            } else {
                doc.resource.relations['liesWithin'].forEach(parentId => {
                    docRefMap[parentId]['children'].push(docRef);
                    docRef['parent'] = docRefMap[parentId];
                });
            }
        });
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
                if(this.isDescendantPartOfResult(child)) {
                    if (this.childrenHiddenFor(docRef.doc.resource.id))
                        this.toggleChildrenForId(docRef.doc.resource.id);
                    return true;
                }
        return false;
    }

    private documentsInclude(doc: IdaiFieldDocument): boolean {
        return this.documents.some(d => d.resource.id == doc.resource.id );
    }
}