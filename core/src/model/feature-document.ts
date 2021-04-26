import {Document} from './document';
import {ObjectUtils, takeOrMake} from '../tools';
import {FeatureResource} from './feature-resource';
import {FieldDocument} from './field-document';
import { Resource } from './resource';
import {Relations} from './relations';

/**
 * @author Daniel de Oliveira
 */
export interface FeatureDocument extends FieldDocument {

    resource: FeatureResource;
}


export module FeatureDocument {

    export function fromDocument(document: Document): FeatureDocument {

        // const doc = FieldDocument.fromDocument(ObjectUtils.clone(document)); TODO review after release of 2.19
        return FieldDocument.fromDocument(document) as any;
    }
}
