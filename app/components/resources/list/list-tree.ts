import {DocumentReference} from './document-reference';
import {IdaiFieldDocumentDatastore} from '../../../core/datastore/idai-field-document-datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

/**
 *
 */
export class ListTree {

    public childrenShownForIds: string[] = [];

    constructor(private datastore: IdaiFieldDocumentDatastore) {}


	public async buildTreeFrom(
	    documents: Array<IdaiFieldDocument>,
        keepShownChildren?: boolean): Promise<DocumentReference[]> {

        if (!keepShownChildren) this.childrenShownForIds = [];

        return ListTree.buildTreeFromLiesWithinRelations(
            await this.addMissingParentsTo(
                ListTree.buildDocRefMap(documents),
                this.childrenShownForIds)
        );
    }


    public toggleChildrenForId(id: string) {

        const index = this.childrenShownForIds.indexOf(id);
        index != -1 ?
            this.childrenShownForIds.splice(index, 1) :
            this.childrenShownForIds.push(id);
    }


    public childrenHiddenFor(id: string): boolean {

        return this.childrenShownForIds.indexOf(id) == -1
    }


    private getBy(resourceId: string): Promise<IdaiFieldDocument> {

        return this.datastore.get(resourceId);
    }


    private async addMissingParentsTo(
        docRefMap: {[type: string]: DocumentReference},
        childrenShownForIds: any): Promise<any> {

        const promises: Array<Promise<any>> = [];

        for (let docId in docRefMap) {
            let doc = docRefMap[docId].doc;

            if (!doc.resource.relations['liesWithin'] || doc.resource.relations['liesWithin'].length < 1) continue; 
            for (let parentId of doc.resource.relations['liesWithin']) {
                if (!docRefMap[parentId]) {
                    promises.push(this.getBy(parentId).then((pdoc: any) => {
                        docRefMap[parentId] = { doc: pdoc, children: [] };
                        childrenShownForIds.push(parentId);
                        if (pdoc.resource.relations['liesWithin'] && pdoc.resource.relations['liesWithin'].length > 0)
                            promises.push(
                                this.addMissingParentsTo(
                                    docRefMap,
                                    childrenShownForIds));
                    }));
                }
            }
        }

        await Promise.all(promises);
        return docRefMap;
    }


    private static buildTreeFromLiesWithinRelations(
        docRefMap: {[type: string]: DocumentReference}): DocumentReference[] {

        const docRefTree: DocumentReference[] = [];

        for (let docId in docRefMap) {

            const doc = docRefMap[docId].doc;
            const docRef = docRefMap[doc.resource.id as any];

            if (!doc.resource.relations['liesWithin']) {
                docRefTree.push(docRef);
            } else {
                for (let parentId of doc.resource.relations['liesWithin']) {
                    docRefMap[parentId].children.push(docRef);
                    docRef.parent = docRefMap[parentId];
                }
            }
        }

        return docRefTree;
    }


    private static buildDocRefMap(documents: Array<IdaiFieldDocument>):
        {[type: string]: DocumentReference} {

        return documents.reduce((docRefMap: any, doc) => {
                docRefMap[doc.resource.id as any] =
                    { doc: doc, children: [] };
                return docRefMap
            }, {});
    }
}