import {to} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(documents: Array<Document>) {

    documents.map(to('resource')).forEach(preprocessFieldsForResource);
}


function preprocessFieldsForResource(resource: Resource) {

    trimFields(resource);
}


