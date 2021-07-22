import { Document, toResourceId, childrenOf, Find } from 'idai-field-core';
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
}
