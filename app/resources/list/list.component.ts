import {Component, EventEmitter, Input, OnChanges, Output} from "@angular/core";
import {Document} from "idai-components-2/core";
import {IdaiFieldDocument} from "idai-components-2/idai-field-model";
import {ConfigLoader, IdaiType} from "idai-components-2/configuration";
import {Messages} from "idai-components-2/messages";
import {ResourcesComponent} from "../resources.component";
import {DocumentReference} from "./document-reference";
import {Loading} from "../../widgets/loading";
import {IdaiFieldDatastore} from "../../datastore/idai-field-datastore";

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

    private childrenShownForIds: string[] = [];

    private awaitsReload: boolean = false;
    
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

        // TODO show loading icon

        this.populateTree()
            .catch(msgWithParams => this.messages.add(msgWithParams))
            .then(() => {
                this.loading.stop();
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

    private populateTree(): Promise<any> {

        let docRefMap: {[type: string]: DocumentReference} = {};

        this.docRefTree = [];

        // TODO what was this for?
        // if (!this.selectedMainTypeDocument) {
        //     this.awaitsReload = false;
        //     return Promise.resolve();
        // }

        return this.datastore.find(
            {constraints:{'resource.relations.isRecordedIn': this.selectedMainTypeDocument.resource.id}}
            ).then(resultDocs => {

            // initialize docRefMap to make sure it is fully populated before building the tree
            resultDocs.forEach(doc => {
                let docRef: DocumentReference = { doc: doc, children: [] };
                docRefMap[doc.resource.id] = docRef;
            });

            // build tree from liesWithin relations
            resultDocs.forEach(doc => {
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
            this.awaitsReload = false;
        });
    }

    private documentsInclude(doc: IdaiFieldDocument): boolean {
        return this.documents.some(d => d.resource.id == doc.resource.id );
    }
}