import {Document} from './document';
import {ObjectUtils, takeOrMake} from '../tools';
import {FeatureResource} from './feature-resource';
import {FieldDocument} from './field-document';

/**
 * @author Daniel de Oliveira
 */
export interface FeatureDocument extends FieldDocument {

    resource: FeatureResource;
}


export module FeatureDocument {

    export function fromDocument(document: Document): FeatureDocument {

        const doc = FieldDocument.fromDocument(ObjectUtils.clone(document));

        takeOrMake(doc, ['resource','relations','isAfter'], []);
        takeOrMake(doc, ['resource','relations','isBefore'], []);
        takeOrMake(doc, ['resource','relations','isContemporaryWith'], []);
        return doc as any;
    }
}
