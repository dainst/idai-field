import {assoc, union, dissoc, equal, takeRight, to, cond, is, isnt,
    take, flow, compose, dropRight, append, copy} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';


/**
 * @param resources ordered by time ascending
 *   expected to be of at least length 2.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function solveProjectResourceConflicts(resources: Resources) {

    if (isnt(2)(len(resources))) throw "FATAL - illegal argument - resources must have length 2";

    let quitEarly = false;

    return resources.reduceRight((resources: Array<Resource>, ultimate: Resource) => {

        if (quitEarly) return resources;
        const penultimate: Resource|undefined = to('[0]')(getPenultimate(resources));

        if (!penultimate) {
            quitEarly = true;
            return resources;
        }

        const result = solveConflictBetween2ProjectDocuments(
                penultimate,
                ultimate);

        if (!result) {
            quitEarly = true;
            return resources;
        }

        return flow(
            resources,
            dropRight(2),
            append([result]));

    }, copy(resources))[0];
}


// TODO return undefined if could not resolve conflict
function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

    if (equal(left)(right)) return left;


    const constantFields = ['id', 'relations', 'type', 'identifier'];

    const l = constantFields.reduce(withDissoc, left);
    const r = constantFields.reduce(withDissoc, right);

    if (Object.keys(l).length === 0) return right;
    else if (Object.keys(r).length === 0) return left;

    const lWithoutStaff = dissoc('staff')(l);
    const rWithoutStaff = dissoc('staff')(r);

    if (left.staff && right.staff && equal(lWithoutStaff)(rWithoutStaff)) {
        return assoc('staff', union([left.staff, right.staff]))(left);
    }
    else throw "solution for that case not implemented yet"
}


const len = <A>(as: Array<A>) => as.length; // TODO put to tsfun


/**
 * Gets the penultimate of an Array of A's, if it exists.
 * @returns A|undefined
 */
const getPenultimate = compose(
    takeRight(2),
    cond(
        compose(len, is(2)),
        take(1),
        take(0)));


export type Resources = Array<Resource>;

