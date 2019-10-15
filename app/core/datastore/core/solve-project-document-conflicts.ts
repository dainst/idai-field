import {assoc, union, dissoc, equal} from 'tsfun';
import {Document} from 'idai-components-2';
import {withDissoc} from '../../import/util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 *
 * @param document
 */
export function solveProjectDocumentConflicts(document: Document) {

    (document.resource as any)['conflictedField'] = 0; // THIS IS TO MOCK A SUCCESSFUL MANUAL CONFLICT RESOLUTION
}


export function solveConflictBetweenMultipleProjectDocuments(...documents: Array<Document>) {

    return documents.reduce(solveConflictBetween2ProjectDocuments);
}


function solveConflictBetween2ProjectDocuments(left: Document, right: Document) {

    if (equal(left.resource)(right.resource)) return left;


    const constantFields = ['id', 'relations', 'type', 'identifier'];

    const l = constantFields.reduce(withDissoc, left.resource);
    const r = constantFields.reduce(withDissoc, right.resource);

    if (Object.keys(l).length === 0) return right;
    else if (Object.keys(r).length === 0) return left;

    const lWithoutStaff = dissoc('staff')(l);
    const rWithoutStaff = dissoc('staff')(r);

    if (left.resource.staff && right.resource.staff && equal(lWithoutStaff)(rWithoutStaff)) {
        return assoc('resource.staff', union([left.resource.staff, right.resource.staff]))(left);
    }
    else throw "solution for that case not implemented yet"
}