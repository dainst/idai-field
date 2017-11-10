import {DocumentReference} from './document-reference';
import {IdaiFieldDocumentDatastore} from '../../../core/datastore/idai-field-document-datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

/**
 *
 */
export class ListTree {

	private documents: IdaiFieldDocument[] = [];
    public childrenShownForIds: string[] = [];
    public docRefTree: DocumentReference[];
    private docRefMap: {[type: string]: DocumentReference} = {};


    constructor(private datastore: IdaiFieldDocumentDatastore) {}


	public buildTreeFrom(documents: Array<IdaiFieldDocument>, keepShownChildren?: boolean) {

		this.documents = documents;

        this.docRefTree = [];

        if (!keepShownChildren) this.childrenShownForIds = [];

        this.docRefMap = {};

        // initialize docRefMap to make sure it is fully populated before building the tree
        for (let doc of documents) {
            this.docRefMap[doc.resource.id as any] = { doc: doc, children: [] };
        }

        this.getMissingParents().then(() =>
            this.buildTreeFromLiesWithinRelations()
        );
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


    private getMissingParents(): Promise<any> {

        const promises: Array<Promise<any>> = [];

        for (let docId in this.docRefMap) {
            let doc = this.docRefMap[docId].doc;

            if (!doc.resource.relations['liesWithin'] || doc.resource.relations['liesWithin'].length < 1) continue; 
            for (let parentId of doc.resource.relations['liesWithin']) {
                if (!this.docRefMap[parentId]) {
                    promises.push(this.datastore.get(parentId).then((pdoc) => {
                        this.docRefMap[parentId] = { doc: pdoc, children: [] };
                        this.childrenShownForIds.push(parentId);
                        if (pdoc.resource.relations['liesWithin'] && pdoc.resource.relations['liesWithin'].length > 0)
                            promises.push(this.getMissingParents());
                    }));
                }
            }
        }

        return Promise.all(promises);
    }


    private buildTreeFromLiesWithinRelations() {

        for (let docId in this.docRefMap) {

            const doc = this.docRefMap[docId].doc;
            const docRef = this.docRefMap[doc.resource.id as any];

            if (!doc.resource.relations['liesWithin']) {
                this.docRefTree.push(docRef);
            } else {
                for (let parentId of doc.resource.relations['liesWithin']) {
                    this.docRefMap[parentId].children.push(docRef);
                    docRef.parent = this.docRefMap[parentId];
                }
            }
        }
    }


    private documentsInclude(doc: IdaiFieldDocument): boolean {

        return this.documents.some(d => d.resource.id == doc.resource.id );
    }
}