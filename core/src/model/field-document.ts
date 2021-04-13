import { ObjectUtils, takeOrMake } from '../tools';
import {Document} from './document';
import {FieldResource} from './field-resource';


export interface FieldDocument extends Document {

    resource: FieldResource;
    id?: string;
}


export module FieldDocument {

    export function fromDocument(document: Document): FieldDocument {

        const doc = ObjectUtils.clone(document);
        takeOrMake(doc, ['resource','relations','isRecordedIn'], []);
        return doc as any;
    }
}