import {FieldDocument, Document, Constraint} from 'idai-components-2';
import {clone} from '../util/object-util';
import {PersistenceManager} from '../model/persistence-manager';
import {IndexFacade} from '../datastore/index/index-facade';
import {IdaiType} from '../configuration/model/idai-type';


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

        if (newParent.resource.type === 'Project') {
            document.resource.relations['isRecordedIn'] = [];
            document.resource.relations['liesWithin'] = [];
        } else if (isRecordedInTargetTypes.map(type => type.name)
                .includes(newParent.resource.type)) {
            document.resource.relations['isRecordedIn'] = [newParent.resource.id];
            document.resource.relations['liesWithin'] = [];
        } else {
            document.resource.relations['liesWithin'] = [newParent.resource.id];
            document.resource.relations['isRecordedIn'] = newParent.resource.relations['isRecordedIn'];
        }
    }


    export async function createConstraints(document: FieldDocument, indexFacade: IndexFacade)
            : Promise<{ [name: string]: Constraint }> {

        return {
            'id:match': {
                value: await getResourceIdsToSubtract(document, indexFacade),
                subtract: true
            }
        };
    }


    async function getResourceIdsToSubtract(document: FieldDocument,
                                            indexFacade: IndexFacade): Promise<string[]> {

        const ids: string[] = [document.resource.id];

        const parentId: string|undefined = getParentId(document);
        if (parentId) ids.push(parentId);

        return ids.concat(indexFacade.getDescendantIds(
            'liesWithin:contain', document.resource.id
        ));
    }


    function getParentId(document: FieldDocument): string|undefined {

        if (Document.hasRelations(document, 'liesWithin')) {
            return document.resource.relations['liesWithin'][0];
        } else if (Document.hasRelations(document, 'isRecordedIn')) {
            return document.resource.relations.isRecordedIn[0];
        }
    }
}