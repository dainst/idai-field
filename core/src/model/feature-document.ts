import {Document} from './document';
import {ObjectUtils, takeOrMake} from '../tools';
import {FeatureResource} from './feature-resource';
import {FieldDocument} from './field-document';
import { Resource } from './resource';
import { TimeRelations } from './relation-constants';

/**
 * @author Daniel de Oliveira
 */
export interface FeatureDocument extends FieldDocument {

    resource: FeatureResource;
}


export module FeatureDocument {

    export function fromDocument(document: Document): FeatureDocument {

        const doc = FieldDocument.fromDocument(ObjectUtils.clone(document));

        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, TimeRelations.AFTER], []);
        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, TimeRelations.BEFORE], []);
        takeOrMake(doc, [Document.RESOURCE, Resource.RELATIONS, TimeRelations.CONTEMPORARY], []);
        return doc as any;
    }
}
