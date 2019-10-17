import {assoc, union, dissoc, equal, takeRight, to, cond, is, isEmpty,
    flow, compose, dropRight, append, len, val, map, filter, isDefined} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';
import {DatastoreUtil} from './datastore-util';
import last = DatastoreUtil.last;


export module ProjectResourceConflictResolution {

    const constantProjectFields = ['id', 'relations', 'type', 'identifier'];


    /**
     * @param resources
     *   expected to be of at least length 2.
     */
    export function createResourceForNewRevisionFrom(resources: Resources): Resource {

        if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

        const staffUnion = flow(resources, map(to(STAFF)), filter(isDefined),  union);
        return flow(resources, last, assoc(STAFF, staffUnion));
    }


    /**
     * @param resources ordered by time ascending
     *   expected to be of at least length 2.
     *
     * @returns a resolved resource and the positions of the resources that have been used to do this.
     *
     * @author Thomas Kleinke
     * @author Daniel de Oliveira
     */
    export function solveProjectResourceConflicts(resources: Resources): [Resource, number[]] {

        if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

        const [collapsed, indicesOfUsedResources] = collapse(resources, []);
        return [collapsed[0], indicesOfUsedResources.reverse()];
    }


    function collapse(resources: Resources, indicesOfUsedResources: number[]): [Resources, number[]] {

        if (resources.length < 2) return [resources, indicesOfUsedResources];

        const ultimate = last(resources);
        const penultimate = getPenultimate(resources);

        const selected = solveConflictBetween2ProjectDocuments(penultimate, ultimate);
        return selected !== NONE
            ? collapse(replacePairWithResolvedOne(resources, selected), indicesOfUsedResources.concat(resources.length - 2))
            : collapse(replacePairWithResolvedOne(resources, ultimate), indicesOfUsedResources);
    }


    function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

        if (equal(left)(right)) return left;

        const l = withoutConstantProjectFields(left);
        const r = withoutConstantProjectFields(right);

        if      (isEmpty(l)) return right;
        else if (isEmpty(r)) return left;

        if (equal(withoutStaff(l))(withoutStaff(r))) {
            if (left.staff && right.staff) return assoc(STAFF, union([left.staff, right.staff]))(left);
            if (left.staff)                return assoc(STAFF, left.staff)(left);
            if (right.staff)               return assoc(STAFF, right.staff)(left);
        }
        return NONE;
    }


    const STAFF = 'staff';


    const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);


    const withoutStaff = dissoc(STAFF);


    const lengthIs2 = compose(len, is(2));


    function replacePairWithResolvedOne(resources: Resources, solved: Resource) {

        return flow(resources, dropRight(2), append([solved]));
    }


    /**
     * Gets the penultimate of an Array of A's, if it exists.
     * @returns A|undefined
     */
    const getPenultimate = compose(
        takeRight(2),
        cond(
            lengthIs2,
            to('[0]'),
            val(undefined)));


    const NONE = undefined;
}


export type Resources = Array<Resource>;
