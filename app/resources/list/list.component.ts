import {Component, Output, OnChanges, EventEmitter, Input} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration';
import {Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';
import {ResourcesComponent} from '../resources.component';
import {DocumentReference} from './document-reference';
import {Loading} from '../../widgets/loading';

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

    private docRefMap: {[type: string]: DocumentReference};
    private docRefTree: DocumentReference[];

    @Output() onDocumentCreation: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public typesMap: { [type: string]: IdaiType };

    private childrenShownForIds: string[] = [];

    private awaitsReload: boolean = false;
    
    constructor(

        private datastore: IdaiFieldDatastore,
        private resourcesComponent: ResourcesComponent,
        private messages: Messages,
        private loading: Loading,
        configLoader: ConfigLoader
    ) {

        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.typesMap = projectConfiguration.getTypesMap();
        });
    }

    ngOnChanges() {

        // TODO show loading icon

        this.populateTree()
            .catch(msgWithParams => this.messages.add(msgWithParams))
            .then(() => {
                this.loading.stop();
            })
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
            if (this.resourcesComponent.documentsInclude(parent.doc as IdaiFieldDocument))
                return true;
            parent = parent['parent'];
        }
        return false;
    }

    private isDescendantPartOfResult(docRef: DocumentReference): boolean {

        if (this.resourcesComponent.documentsInclude(docRef.doc as IdaiFieldDocument))
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

    private populateTree(): Promise<any> {

        this.docRefTree = [];
        this.docRefMap = {};

        // TODO what was this for?
        // if (!this.selectedMainTypeDocument) {
        //     this.awaitsReload = false;
        //     return Promise.resolve();
        // }

        // initialize docRefMap to make sure it is fully populated before building the tree
        this.documents.forEach(doc => {
            let docRef: DocumentReference = { doc: doc, children: [] };
            this.docRefMap[doc.resource.id] = docRef;
        });
        // build tree from liesWithin relations
        this.documents.forEach(doc => {
            let docRef = this.docRefMap[doc.resource.id];
            if (!doc.resource.relations['liesWithin']) {
                this.docRefTree.push(docRef);
            } else {
                doc.resource.relations['liesWithin'].forEach(parentId => {
                    this.docRefMap[parentId]['children'].push(docRef);
                    docRef['parent'] = this.docRefMap[parentId];
                });
            }
        });
        this.awaitsReload = false;

        return Promise.resolve();
    }
}