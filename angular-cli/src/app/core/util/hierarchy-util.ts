import {Resource} from 'idai-components-2';
import {DocumentReadDatastore} from '../datastore/document-read-datastore';


/**
 * @author Thomas Kleinke
 */
export module HierarchyUtil {

    export async function getParent(resource: Resource,
                                    datastore: DocumentReadDatastore): Promise<Resource|undefined> {

        return resource.relations['liesWithin'] && resource.relations['liesWithin'].length > 0
            ? (await datastore.get(resource.relations.liesWithin[0])).resource
            : resource.relations['isRecordedIn'] && resource.relations['isRecordedIn'].length > 0
                ? (await datastore.get(resource.relations.isRecordedIn[0])).resource
                : undefined;
    }
}