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
        const doc = document;

        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.AFTER], []);
        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.BEFORE], []);
        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.CONTEMPORARY], []);
        return doc as any;
    }
}
