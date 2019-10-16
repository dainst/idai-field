import {assoc, union, dissoc, equal} from 'tsfun';
import {Resource} from 'idai-components-2';
import {withDissoc} from '../../import/util';


/**
 * @param resources ordered by time ascending
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function solveProjectResourceConflicts(resources: Array<Resource>) {

    /**
     * TODO review: make sure the latestrevision is the 'seed' of reduce
     */
    return resources.reduceRight(solveConflictBetween2ProjectDocuments);
}


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