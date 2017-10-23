import {Serializer} from './serializer';
import {Document} from 'idai-components-2/core';


/**
 * @author Thomas Kleinke
 */
export class NativeJsonlSerializer implements Serializer {


    public serialize(documents: Array<Document>): string {

        let result: string = '';

        for (let document of documents) {
            result += JSON.stringify(document.resource);
            result += '\n';
        }

        return result;
    }
}