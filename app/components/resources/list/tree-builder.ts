import {Node} from './node';
import {IdaiFieldDocumentDatastore} from '../../../core/datastore/idai-field-document-datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {FoldState} from './fold-state';

/**
 *
 */
export class TreeBuilder {

    constructor(
        private datastore: IdaiFieldDocumentDatastore,
        private foldStatus: FoldState
    ) {}


	public async from(
	    documents: Array<IdaiFieldDocument>): Promise<Node[]> {

        return TreeBuilder.buildTreeFromLiesWithinRelations(
            await this.addMissingParentsTo(
                TreeBuilder.buildNodesMap(documents))
        );
    }


    private async addMissingParentsTo(
        nodesMap: {[resourceId: string]: Node}): Promise<any> {

        const promises: Array<Promise<any>> = [];

        for (let docId in nodesMap) {
            let doc = nodesMap[docId].doc;

            if (!doc.resource.relations['liesWithin'] || doc.resource.relations['liesWithin'].length < 1) continue; 
            for (let parentId of doc.resource.relations['liesWithin']) {
                if (!nodesMap[parentId]) {
                    promises.push(this.getBy(parentId).then((pdoc: any) => {
                        nodesMap[parentId] = { doc: pdoc, children: [] };
                        this.foldStatus.add(parentId);
                        if (pdoc.resource.relations['liesWithin'] && pdoc.resource.relations['liesWithin'].length > 0) {
                            promises.push(this.addMissingParentsTo(nodesMap));
                        }
                    }));
                }
            }
        }

        await Promise.all(promises);
        return nodesMap;
    }


    private getBy(resourceId: string): Promise<IdaiFieldDocument> {

        return this.datastore.get(resourceId);
    }


    private static buildTreeFromLiesWithinRelations(
        nodesMap: {[resourceId: string]: Node}): Node[] {

        const docRefTree: Node[] = [];

        for (let docId in nodesMap) {

            const doc = nodesMap[docId].doc;
            const docRef = nodesMap[doc.resource.id as any];

            if (!doc.resource.relations['liesWithin']) {
                docRefTree.push(docRef);
            } else {
                for (let parentId of doc.resource.relations['liesWithin']) {
                    nodesMap[parentId].children.push(docRef);
                    docRef.parent = nodesMap[parentId];
                }
            }
        }

        return docRefTree;
    }


    private static buildNodesMap(documents: Array<IdaiFieldDocument>):
        {[resourceId: string]: Node} {

        return documents.reduce((docRefMap: any, doc) => {
                docRefMap[doc.resource.id as any] =
                    { doc: doc, children: [] };
                return docRefMap
            }, {});
    }
}