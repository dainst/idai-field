import { dissocIndices, last2, replaceLastPair, sortRevisionsByLastModified } from '@idai-field/core';
import { Document, Resource } from 'idai-components-2';
import {
    append, compose, equal, filter, flow, isDefined,
    isEmpty,
    left, map,
    Pair,
    update as updateOn,
    dissoc,
    update_a as updateAsc,
    right, to, union as tsfunUnion, lookup_a
} from 'tsfun';
import { RevisionId } from '../../constants';
import { clone } from '../../util/object-util';
import { withDissoc } from '../../util/utils';
import RESOURCE = Document.RESOURCE;

type ArrayIndex = number;

export const STAFF = 'staff';
export const CAMPAIGNS = 'campaigns';
const CRS = 'coordinateReferenceSystem';

const constantProjectFields = [CRS].concat(Resource.CONSTANT_FIELDS);

const union = compose(filter(isDefined) as any, tsfunUnion as any);
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
    const conflictedSortedRevisions = sortRevisionsByLastModified(conflictedRevisions);

    const [resource, revisionIds] = resolve(
        conflictedSortedRevisions.map(to(Document.RESOURCE)),
        clonedLatestRevision.resource,
        conflictedSortedRevisions.map(to(Document._REV))
    );

    if (resource[STAFF] && resource[STAFF].length === 0) delete resource[STAFF];
    if (resource[CAMPAIGNS] && resource[CAMPAIGNS].length === 0) delete resource[CAMPAIGNS];

    // this is to work with the latest changes history
    const latestRevisionDocumentWithInsertedResultResource = updateOn(RESOURCE, resource)(clonedLatestRevision) as any /* TODO review */;

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
        indicesOfResolvedRevisions.map(lookup_a(conflicts)) as RevisionId[]
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
            return flow(conflictedRevisions,
                append(latestRevision),
                map(to(fieldName)),
                union);
        };

        return flow(latestRevision,
            updateAsc(STAFF, unifyFields(STAFF)),
            updateAsc(CAMPAIGNS, unifyFields(CAMPAIGNS)) as any);
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
    const lastPair: Pair<Resource, Resource> = last2(revisions);

    const resolved = solveConflictBetweenTwoRevisions(left(lastPair), right(lastPair));
    return resolved !== undefined
        ? collapse(replaceLastPair(revisions, resolved), indicesOfUsedRevisions.concat(revisions.length - 2))
        : collapse(replaceLastPair(revisions, right(lastPair)), indicesOfUsedRevisions);
}


function solveConflictBetweenTwoRevisions(l: Resource, r: Resource): Resource|undefined {

    if (equal(l)(r)) return r;

    const l_ = withoutConstantProjectFields(l);
    const r_ = withoutConstantProjectFields(r);

    if (isEmpty(l_) && l[CRS] === r[CRS]) return r;
    else if (isEmpty(r_) && l[CRS] === r[CRS]) return l;

    if (equal(withoutStaffAndCampaigns(l as any), withoutStaffAndCampaigns(r as any))) {
        return flow(r,
            updateAsc(STAFF, union([l[STAFF], r[STAFF]])),
            updateAsc(CAMPAIGNS, union([l[CAMPAIGNS], r[CAMPAIGNS]])) as any);
    }

    return undefined;
}
