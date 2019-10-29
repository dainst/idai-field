import {isNot, includedIn, isnt} from 'tsfun';
import {NewDocument, Document, Resource} from 'idai-components-2';
import {clone} from '../../../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../../model/relation-constants';



/**
 * @author Daniel de Oliveira
 */
export function mergeDocument(into: Document, additional: NewDocument): Document {

    console.log('mergeDocument', additional);

    const target = clone(into);

    target.resource =
        Object.keys(additional.resource)
            .filter(isNot(includedIn(Resource.CONSTANT_FIELDS)))
            .reduce((target: Resource, fieldName: string) => {

                if (additional.resource[fieldName] === null) delete target[fieldName];
                else target[fieldName] = clone(additional.resource[fieldName]);

                return target;
            }, target.resource);

    if (!additional.resource.relations) return target;

    target.resource.relations =
        Object.keys(additional.resource.relations) // TODO factor out more generic function
            .filter(isnt(HIERARCHICAL_RELATIONS.RECORDED_IN))
            .reduce((target: {[relationName: string]: string[]}, relationName: string) => {

                if (additional.resource.relations[relationName] === null) delete target[relationName];
                else target[relationName] = additional.resource.relations[relationName];

                return target;
            }, target.resource.relations ? target.resource.relations : {});


    return target;
}
