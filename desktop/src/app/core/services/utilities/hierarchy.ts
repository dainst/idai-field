import { Document, toResourceId, childrenOf, Relation, Resource, Datastore } from 'idai-field-core';
import { on, set } from 'tsfun';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export namespace Hierarchy {

    export async function getWithDescendants<D extends Document>(find: Datastore.Find,
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


    export async function getParent(get: Datastore.Get,
                                    resource: Resource): Promise<Resource|undefined> {

        return resource.relations['liesWithin'] && resource.relations['liesWithin'].length > 0
            ? (await get(resource.relations.liesWithin[0])).resource
            : resource.relations['isRecordedIn'] && resource.relations['isRecordedIn'].length > 0
                ? (await get(resource.relations.isRecordedIn[0])).resource
                : undefined;
    }


    // TODO review if our datastore can do this, too, via contraintIndex
    export async function getAntescendents(get: Datastore.Get,
                                           id: Resource.Id): Promise<Array<Document>> {

        try {
            const document = await get(id);
            return [document].concat(await _getAntecendents(get, document));
        } catch {
            console.error('error in Hierarchy.getAntescendents()');
            return [];
        }
    }


    async function _getAntecendents(get: Datastore.Get,
                                    document: Document): Promise<Array<Document>> {

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
