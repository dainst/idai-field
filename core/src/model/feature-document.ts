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

    // TODO review, dating?
    export function fromDocument(document: Document): FeatureDocument {

        const doc = ObjectUtils.clone(document);
        takeOrMake(doc, ['resource','relations','isRecordedIn'], []);
        return doc as any;
    }
}
