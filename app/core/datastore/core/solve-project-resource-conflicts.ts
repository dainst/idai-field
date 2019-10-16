import {assoc, union, dissoc, equal, takeRight, to, cond, is, isnt,
    take, flow, compose, dropRight, append, copy} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';


/**
 * Folds resources pairwise from the right.
 * If a pair can be auto-resolved, the pair gets replaced by the one resolved resource.
 * If a pair cannot be auto-resolved, the procedure stops and the intermediate resources get returned.
 *
 * @param resources ordered by time ascending
 *   expected to be of at least length 2.
 *
 * @returns resources either fully folded (list of length 1) or an intermediate result of the folding process.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function solveProjectResourceConflicts(resources: Resources): Resources {

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

    }, copy(resources));
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

const lengthIs2 = compose(len, is(2));

/**
 * Gets the penultimate of an Array of A's, if it exists.
 * @returns A|undefined
 */
const getPenultimate = compose(
    takeRight(2),
    cond(
        lengthIs2,
        take(1),
        take(0)));


export type Resources = Array<Resource>;

