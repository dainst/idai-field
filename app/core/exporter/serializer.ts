import {Document} from 'idai-components-2/core';


/**
 * @author Thomas Kleinke
 */
export interface Serializer {


    serialize(documents: Array<Document>): string
}