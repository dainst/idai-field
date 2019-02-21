import {FieldDocument, Document, IdaiType, Constraint} from 'idai-components-2';
import {clone} from '../../core/util/object-util';
import {PersistenceManager} from '../../core/model/persistence-manager';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';


/**
 * @author Thomas Kleinke
 */
export module MoveUtility {

    export async function moveDocument(document: FieldDocument, newParent: FieldDocument, username: string,
                                       persistenceManager: PersistenceManager,
                                       isRecordedInTargetTypes: Array<IdaiType>) {

        const oldVersion: FieldDocument = clone(document);
        updateRelations(document, newParent, isRecordedInTargetTypes);
        await persistenceManager.persist(document, username, oldVersion);
    }


    function updateRelations(document: FieldDocument, newParent: FieldDocument,
                             isRecordedInTargetTypes: Array<IdaiType>) {

        if (isRecordedInTargetTypes.map(type => type.name)
            .includes(newParent.resource.type)) {
            document.resource.relations['isRecordedIn'] = [newParent.resource.id];
            document.resource.relations['liesWithin'] = [];
        } else {
            document.resource.relations['liesWithin'] = [newParent.resource.id];
            document.resource.relations['isRecordedIn'] = newParent.resource.relations['isRecordedIn'];
        }
    }


    export async function createConstraints(document: FieldDocument, datastore: FieldReadDatastore)
            : Promise<{ [name: string]: Constraint }> {

        return {
            'id:match': {
                value: await getResourceIdsToSubtract(document, datastore),
                type: 'subtract'
            }
        };
    }


    async function getResourceIdsToSubtract(document: FieldDocument,
                                            datastore: FieldReadDatastore): Promise<string[]> {

        const ids: string[] = [document.resource.id];

        if (Document.hasRelations(document, 'liesWithin')) {
            ids.push(document.resource.relations['liesWithin'][0]);
        } else if (Document.hasRelations(document, 'isRecordedIn')) {
            ids.push(document.resource.relations.isRecordedIn[0]);
        }

        return ids.concat(await getDescendantIds(document, datastore));
    }


    async function getDescendantIds(document: FieldDocument,
                                    datastore: FieldReadDatastore): Promise<string[]> {

        const descendants: Array<FieldDocument> = (await datastore.find(
            { constraints: { 'liesWithin:contain': document.resource.id } }
        )).documents;

        let descendantIds: string[] = descendants.map(descendant => descendant.resource.id);

        for (let descendant of descendants) {
            descendantIds = descendantIds.concat(await getDescendantIds(descendant, datastore));
        }

        return descendantIds;
    }
}