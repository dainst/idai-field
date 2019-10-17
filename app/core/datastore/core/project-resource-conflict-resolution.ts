import {assoc, union, dissoc, equal, takeRight, to, cond, is, isEmpty,
    flow, compose, dropRight, append, copy, len, val, map, filter, isDefined} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';
import {DatastoreUtil} from './datastore-util';


export module ProjectResourceConflictResolution {

    import last = DatastoreUtil.last;
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
     * @param resources_ ordered by time ascending
     *   expected to be of at least length 2.
     *
     * @returns a resolved resource and the positions of the resources that have been used to do this.
     *
     * @author Thomas Kleinke
     * @author Daniel de Oliveira
     */
    export function solveProjectResourceConflicts(resources_: Resources): [Resource, number[]] {

        let resources = copy(resources_);
        if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

        let indicesOfUsedResources: number[] = [];

        while (resources.length > 1) {

            const ultimate = last(resources);
            const penultimate = getPenultimate(resources);

            const selected = solveConflictBetween2ProjectDocuments(penultimate, ultimate);
            if (selected === NONE) {
                resources = replacePairWithResolvedOne(resources, ultimate);
            } else {
                indicesOfUsedResources.push(resources.length - 2);
                resources = replacePairWithResolvedOne(resources, selected);
            }
        }
        return [resources[0], indicesOfUsedResources.reverse()];
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
