import {isNot, includedIn} from 'tsfun';
import {NewDocument, Document, Resource} from 'idai-components-2';
import {clone} from '../../../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../../model/relation-constants';



/**
 * @author Daniel de Oliveira
 */
export function mergeDocument(into: Document, additional: NewDocument): Document {

    // console.log('mergeDocument', additional);

    const target = clone(into);

    target.resource =
        overwriteOrDeleteProperties(
            target.resource,
            additional.resource,
            Resource.CONSTANT_FIELDS);

    if (!additional.resource.relations) return target;

    target.resource.relations =
        overwriteOrDeleteProperties(
            target.resource.relations ? target.resource.relations : {},
            additional.resource.relations,
            [HIERARCHICAL_RELATIONS.RECORDED_IN]);

    return target;
}


function overwriteOrDeleteProperties(target: any|undefined, source: any, exclusions: string[]) {

    return Object.keys(source)
        .filter(isNot(includedIn(exclusions)))
        .reduce((target: {[propertyName: string]: string[]}, propertyName: string) => {

            if (source[propertyName] === null) delete target[propertyName];
            else target[propertyName] = source[propertyName];

            return target;
        }, target ? target : {});
}