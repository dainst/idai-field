import {assoc, assocOn, to, lookup, flow, map, filter, isDefined, union as tsfunUnion, equal,
    isEmpty, compose, dissoc, append} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import {RevisionId} from '../../../common/c';
import {dissocIndices, penultimate, replaceLastPair, ultimate} from './helpers';
import {withDissoc} from '../../import/util';
import RESOURCE = Document.RESOURCE;
import {clone} from '../../util/object-util';

type ArrayIndex = number;

export const STAFF = 'staff';
export const CAMPAIGNS = 'campaigns';
const CRS = 'coordinateReferenceSystem';

const constantProjectFields = [CRS].concat(Resource.CONSTANT_FIELDS);

const union = compose(filter(isDefined), tsfunUnion);
const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);
const withoutStaffAndCampaigns = compose(dissoc(STAFF), dissoc(CAMPAIGNS));


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function solveProjectDocumentConflict(latestRevision: Document,
                                             conflictedRevisions: Array<Document>)
        : [Document, RevisionId[] /* of succesfully resolved conflicts */] {

    const clonedLatestRevision = clone(latestRevision);
    const conflictedSortedRevisions = DatastoreUtil.sortRevisionsByLastModified(conflictedRevisions);

    const [resource, revisionIds] = resolve(
        conflictedSortedRevisions.map(to(Document.RESOURCE)),
        clonedLatestRevision.resource,
        conflictedSortedRevisions.map(to(Document._REV)));

    if (resource[STAFF] && resource[STAFF].length === 0) delete resource[STAFF];
    if (resource[CAMPAIGNS] && resource[CAMPAIGNS].length === 0) delete resource[CAMPAIGNS];

    // this is to work with the latest changes history
    const latestRevisionDocumentWithInsertedResultResource = assocOn(RESOURCE, resource)(clonedLatestRevision);

    return [latestRevisionDocumentWithInsertedResultResource, revisionIds];
}


function resolve(conflictedRevisions: Array<Resource>, latestRevision: Resource,
                 conflicts: RevisionId[]): [Resource, RevisionId[]] {

    const [resolvedResource, indicesOfResolvedRevisions]
        = solveProjectResourceConflicts(conflictedRevisions, latestRevision);

    return [
        flow(
            conflictedRevisions,
            dissocIndices(indicesOfResolvedRevisions.sort()),
            unifyCampaignAndStaffFields(resolvedResource)
        ) as Resource,
        indicesOfResolvedRevisions.map(lookup(conflicts)) as RevisionId[]
    ];
}


/**
 * Unifies the STAFF and CAMPAIGN fields of all the revisions.
 * Apart from that, the latest revision is returned.
 *
 * @param latestRevision
 */
function unifyCampaignAndStaffFields(latestRevision: Resource) {

    return(conflictedRevisions: Array<Resource>): Resource => {

        if (conflictedRevisions.length === 0) return latestRevision;

        const unifyFields = (fieldName: string) => {
            return flow(conflictedRevisions, append(latestRevision), map(to(fieldName)), union);
        };

        return flow(latestRevision,
            assoc(STAFF, unifyFields(STAFF)),
            assoc(CAMPAIGNS, unifyFields(CAMPAIGNS)));
    }
}


/**
 * @param conflictedRevisions ordered by time ascending
 *   expected to be of minimum length 1
 *
 * @param latestRevision
 * @returns
 *   - a resolved resource
 *   - the indices of the resources in the resources array
 *     which have been collapsed to give the resolved resource
 */
function solveProjectResourceConflicts(conflictedRevisions: Array<Resource>,
                                       latestRevision: Resource): [Resource, Array<ArrayIndex>] {

    if (conflictedRevisions.length < 1) {
        throw 'FATAL - illegal argument - conflictedRevisions must be of minimum length 1';
    }

    const [[resolvedResource], indicesOfUsedRevisions] = collapse(conflictedRevisions.concat([latestRevision]));
    return [resolvedResource, indicesOfUsedRevisions.reverse()];
}


function collapse(revisions: Array<Resource>, indicesOfUsedRevisions: Array<ArrayIndex> = [])
        : [Array<Resource>, Array<ArrayIndex>] {

    if (revisions.length < 2) return [revisions, indicesOfUsedRevisions];

    const resolved = solveConflictBetweenTwoRevisions(penultimate(revisions), ultimate(revisions) as any);
    return resolved !== undefined
        ? collapse(replaceLastPair(revisions, resolved), indicesOfUsedRevisions.concat(revisions.length - 2))
        : collapse(replaceLastPair(revisions, ultimate(revisions) as any), indicesOfUsedRevisions);
}


function solveConflictBetweenTwoRevisions(left: Resource, right: Resource): Resource|undefined {

    if (equal(left)(right)) return right;

    const l = withoutConstantProjectFields(left);
    const r = withoutConstantProjectFields(right);

    if (isEmpty(l) && left[CRS] === right[CRS]) return right;
    else if (isEmpty(r) && left[CRS] === right[CRS]) return left;

    if (equal(withoutStaffAndCampaigns(left))(withoutStaffAndCampaigns(right))) {
        return flow(right,
            assoc(STAFF, union([left[STAFF], right[STAFF]])),
            assoc(CAMPAIGNS, union([left[CAMPAIGNS], right[CAMPAIGNS]])));
    }

    return undefined;
}