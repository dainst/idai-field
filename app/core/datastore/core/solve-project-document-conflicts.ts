import {assoc, to, lookup, flow, map, filter, isDefined, union, equal,
    isEmpty, getOnOr, compose, dissoc} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import {RevisionId} from '../../../c';
import {dissocIndices, last, penultimate, replaceLast, replaceLastPair, ultimate} from './helpers';
import {withDissoc} from '../../import/util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function solveProjectDocumentConflict(document: Document,
                                             conflictedDocuments: Array<Document>): [Document, RevisionId[] /* of succesfully resolved conflicts */] {

    const conflictedSortedDocuments = DatastoreUtil.sortRevisionsByLastModified(conflictedDocuments);

    const [resource, revisionId] = resolve(
        conflictedSortedDocuments.concat(document).map(to(RESOURCE)),
        conflictedSortedDocuments.map(to(REV_MARKER)));

    // this is to work with the latest changes history
    const latestRevisionDocumentWithInsertedResultResource = assoc(RESOURCE, resource)(document);
    return [latestRevisionDocumentWithInsertedResultResource, revisionId];
}


function resolve(resources: Array<Resource>, conflicts: RevisionId[]): [Resource, RevisionId[]] {

    const [resolvedResource, indicesOfResolvedResources] = solveProjectResourceConflicts(resources);

    return [
        flow(
            resources,
            dissocIndices(indicesOfResolvedResources.sort()),
            replaceLast(resolvedResource),
            crunch) as Resource

        , indicesOfResolvedResources.map(lookup(conflicts)) as RevisionId[]];
}


/**
 * Unifies the STAFF and CAMPAIGN fields of all the resources.
 * Apart from that, the resource returned is a copy of the rightmost
 * resource of resources.
 *
 * @param resources
 *   expected to be of at least length 1.
 */
function crunch(resources: Array<Resource>): Resource {

    if (resources.length === 0) throw 'FATAL - illegal argument - resources must have length 1';
    if (resources.length === 1) return resources[0];

    const staffUnion = flow(resources, map(to(STAFF)), filter(isDefined),  union);
    const campaignsUnion = flow(resources, map(to(CAMPAIGNS)), filter(isDefined),  union);
    return flow(resources,
        last,
        assoc(STAFF, staffUnion),
        assoc(CAMPAIGNS, campaignsUnion));
}


const constantProjectFields = ['id', 'relations', 'type', 'identifier'];


/**
 * @param resources ordered by time ascending
 *   expected to be of at least length 2.
 *
 * @returns a resolved resource and the positions of the resources that have been used to do this.
 *
 */
function solveProjectResourceConflicts(resources: Array<Resource>): [Resource, Array<ArrayIndex>] {

    if (resources.length < 2) throw 'FATAL - illegal argument - resources must have length 2';

    const [[resource], indicesOfUsedResources] = collapse(resources);
    return [resource, indicesOfUsedResources.reverse()];
}


function collapse(resources: Array<Resource>, indicesOfUsedResources: Array<ArrayIndex> = [])
        : [Array<Resource>, Array<ArrayIndex>] {

    if (resources.length < 2) return [resources, indicesOfUsedResources];

    const resolved = solveConflictBetween2ProjectDocuments(penultimate(resources), ultimate(resources));
    return resolved !== NONE
        ? replaceLastTwoThenCollapseRest(resources, indicesOfUsedResources.concat(resources.length - 2), resolved)
        : replaceLastTwoThenCollapseRest(resources, indicesOfUsedResources, ultimate(resources));
}


function replaceLastTwoThenCollapseRest(resources: Array<Resource>, indices: Array<ArrayIndex>, replacement: Resource) {

    return collapse(replaceLastPair(resources, replacement), indices);
}


function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource) {

    if (equal(left)(right)) return left;

    const l = withoutConstantProjectFields(left);
    const r = withoutConstantProjectFields(right);

    if      (isEmpty(l)) return right;
    else if (isEmpty(r)) return left;

    if (equal(withoutStaffAndCampaigns(l))(withoutStaffAndCampaigns(r))) {
        const lCampaigns = getOnOr(CAMPAIGNS, [])(l); // TODO test if, and if not, make sure union ignores undefined. then we can get rid of  these lines
        const rCampaigns = getOnOr(CAMPAIGNS, [])(r);
        const lStaff = getOnOr(STAFF, [])(l);
        const rStaff = getOnOr(STAFF, [])(r);
        return flow(left,
            assoc(STAFF, union([lStaff, rStaff])),
            assoc(CAMPAIGNS, union([lCampaigns, rCampaigns])));
    }
    return NONE;
}


const NONE = undefined;

const RESOURCE = 'resource';

const REV_MARKER = '_rev';

export const STAFF = 'staff';

export const CAMPAIGNS = 'campaigns';

type ArrayIndex = number;


const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);


const withoutStaffAndCampaigns = compose(dissoc(STAFF), dissoc(CAMPAIGNS));
