import { Document, toResourceId, childrenOf, Get, Find, Relation, Resource } from 'idai-field-core';
import { on, set } from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export namespace Hierarchy {

    export async function getWithDescendants<D extends Document>(find: Find,
                                                                 documents: Array<D>)
            : Promise<Array<D>> {

        const documentsIds = documents.map(toResourceId);
        const descendants: Array<D> = [];
        for (let document of documents) {
            const docs = (await find(childrenOf(document.resource.id))).documents
                .filter(doc => !documentsIds.includes(doc.resource.id))

            descendants.push(...docs as Array<D>);
        }
        const descendantsSet = set(on(['resource', 'id']), descendants); // documents may themselves appear as descendants in multiselect
        return descendantsSet.concat(documents);
    }


    // TODO review if our datastore can do this, too, via contraintIndex
    export async function getAntescendents(get: Get, id: Resource.Id): Promise<Array<Document>> {

        try {
            const document = await get(id);
            return [document].concat(await _getAntecendents(get, document));
        } catch {
            console.error('error in Hierarchy.getAntescendents()');
            return [];
        }
    }


    async function _getAntecendents(get: Get, document: Document): Promise<Array<Document>> {

        const documents: Array<Document> = [];

        let current = document;
        while (Document.hasRelations(current, Relation.Hierarchy.LIESWITHIN)
               || Document.hasRelations(current, Relation.Hierarchy.RECORDEDIN)) {

            const parent = await get(
                Document.hasRelations(current, Relation.Hierarchy.LIESWITHIN)
                    ? current.resource.relations[Relation.Hierarchy.LIESWITHIN][0]
                    : current.resource.relations[Relation.Hierarchy.RECORDEDIN][0]
            );

            documents.push(parent);
            current = parent;
        }

        return documents;
    }
}
