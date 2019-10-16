import {assoc, union, dissoc, equal, takeRight, to, cond, is, isEmpty,
    flow, compose, dropRight, append, copy, len, val} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';


const constantProjectFields = ['id', 'relations', 'type', 'identifier'];


/**
 * Collapses resources pairwise from the right.
 * If a pair can be auto-resolved, the pair gets replaced by the one resolved resource.
 * If a pair cannot be auto-resolved, the procedure stops and the intermediate resources get returned.
 *
 * @param resources ordered by time ascending
 *   expected to be of at least length 2.
 *
 * @returns resources either fully collapsed (list of length 1) or an intermediate result of the collapsing process.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function solveProjectResourceConflicts(resources: Resources): Resources {

    if (len(resources) < 2) throw 'FATAL - illegal argument - resources must have length 2';

    let quitEarly = false;

    return collapseRight(resources, (resources: Resources, ultimate: Resource) => {

        if (quitEarly) return resources;

        const penultimate = getPenultimate(resources);
        if (!penultimate) { quitEarly = true; return resources; }

        const solved = solveConflictBetween2ProjectDocuments(penultimate, ultimate);
        if (solved === UNRESOLVED) { quitEarly = true; return resources; }

        return replacePairWithResolvedOne(resources, solved);
    });
}


function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

    if (equal(left)(right)) return left;

    const l = withoutConstantProjectFields(left);
    const r = withoutConstantProjectFields(right);

    if      (isEmpty(l)) return right;
    else if (isEmpty(r)) return left;

    if (left.staff && right.staff && equal(withoutStaff(l))(withoutStaff(r))) {
        return assoc(STAFF, union([left.staff, right.staff]))(left);
    }

    return UNRESOLVED;
}


const STAFF = 'staff';


const collapseRight = <A>(as: Array<A>, f: (as: Array<A>, a: A) => Array<A>) => as.reduceRight(f, copy(as));


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


export type Resources = Array<Resource>;


const UNRESOLVED = undefined;
