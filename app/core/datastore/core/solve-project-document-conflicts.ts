import {assoc, to, lookup, flow, map, filter, isDefined, union, equal,
    isEmpty, getOnOr, compose, dissoc, append} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import {RevisionId} from '../../../c';
import {dissocIndices, penultimate, replaceLastPair, ultimate} from './helpers';
import {withDissoc} from '../../import/util';


/**
 * TODO review if document is not modified in place (important for cases in which no conflicts gets solved)
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function solveProjectDocumentConflict(document: Document,
                                             conflictedDocuments: Array<Document>)
        : [Document, RevisionId[] /* of succesfully resolved conflicts */] {

    const conflictedSortedDocuments = DatastoreUtil.sortRevisionsByLastModified(conflictedDocuments);

    const [resource, revisionIds] = resolve(
        conflictedSortedDocuments.map(to(RESOURCE)),
        document.resource,
        conflictedSortedDocuments.map(to(REV_MARKER)));

    // this is to work with the latest changes history
    const latestRevisionDocumentWithInsertedResultResource = assoc(RESOURCE, resource)(document);
    return [latestRevisionDocumentWithInsertedResultResource, revisionIds];
}


function resolve(resources: Array<Resource>, latestRevisionResource: Resource, conflicts: RevisionId[]): [Resource, RevisionId[]] {

    const [resolvedResource, indicesOfResolvedResources] = solveProjectResourceConflicts(resources, latestRevisionResource);

    return [
        flow(
            resources,
            dissocIndices(indicesOfResolvedResources.sort()),
            unifyCampaignAndStaffFields(resolvedResource)
        ) as Resource,
        indicesOfResolvedResources.map(lookup(conflicts)) as RevisionId[]
    ];
}


/**
 * Unifies the STAFF and CAMPAIGN fields of all the resources.
 * Apart from that, the resource returned is a copy of the rightmost
 * resource of resources.
 *
 * @param latestResource
 */
function unifyCampaignAndStaffFields(latestResource: Resource) {

    return(resources: Array<Resource>): Resource => {

        if (resources.length === 0) return latestResource;

        const unifyFields = (fieldName: string) => {
            return flow(resources, append([latestResource]), map(to(fieldName)), filter(isDefined), union);
        };

        return flow(latestResource,
            assoc(STAFF, unifyFields(STAFF)),
            assoc(CAMPAIGNS, unifyFields(CAMPAIGNS)));
    }
}


/**
 * @param conflictedResources ordered by time ascending
 *   expected to be of minimum length 1
 *
 * @param latestResource
 * @returns
 *   - a resolved resource
 *   - the indices of the resources in the resources array
 *     which have been collapsed to give the resolved resource
 */
function solveProjectResourceConflicts(conflictedResources: Array<Resource>,
                                       latestResource: Resource): [Resource, Array<ArrayIndex>] {

    if (conflictedResources.length < 1) throw 'FATAL - illegal argument - resources must be of minimum length 1';

    const [[resource], indicesOfUsedResources] = collapse(conflictedResources.concat([latestResource]));
    return [resource, indicesOfUsedResources.reverse()];
}


function collapse(resources: Array<Resource>, indicesOfUsedResources: Array<ArrayIndex> = [])
        : [Array<Resource>, Array<ArrayIndex>] {

    if (resources.length < 2) return [resources, indicesOfUsedResources];

    const resolved = solveConflictBetween2ProjectDocuments(penultimate(resources), ultimate(resources));
    return resolved !== undefined
        ? collapse(replaceLastPair(resources, resolved), indicesOfUsedResources.concat(resources.length - 2))
        : collapse(replaceLastPair(resources, ultimate(resources)), indicesOfUsedResources);
}


function solveConflictBetween2ProjectDocuments(left: Resource, right: Resource): Resource|undefined {

    if (equal(left)(right)) return left;

    const l = withoutConstantProjectFields(left);
    const r = withoutConstantProjectFields(right);

    if      (isEmpty(l) && left[COORDINATE_REFERENCE_SYSTEM] === right[COORDINATE_REFERENCE_SYSTEM]) return right;
    else if (isEmpty(r) && left[COORDINATE_REFERENCE_SYSTEM] === right[COORDINATE_REFERENCE_SYSTEM]) return left;

    if (equal(withoutStaffAndCampaigns(left))(withoutStaffAndCampaigns(right))) {
        const lCampaigns = getOnOr(CAMPAIGNS, [])(left); // TODO test if, and if not, make sure union ignores undefined. then we can get rid of  these lines
        const rCampaigns = getOnOr(CAMPAIGNS, [])(right);
        const lStaff = getOnOr(STAFF, [])(left);
        const rStaff = getOnOr(STAFF, [])(right);
        return flow(right,
            assoc(STAFF, union([lStaff, rStaff])),
            assoc(CAMPAIGNS, union([lCampaigns, rCampaigns])));
    }

    return undefined;
}


const COORDINATE_REFERENCE_SYSTEM = 'coordinateReferenceSystem'; // TODO consider in unit test

export const STAFF = 'staff';

export const CAMPAIGNS = 'campaigns';

const constantProjectFields = ['id', 'relations', 'type', 'identifier', COORDINATE_REFERENCE_SYSTEM];

const RESOURCE = 'resource';

const REV_MARKER = '_rev';

type ArrayIndex = number;

const withoutConstantProjectFields = (resource: Resource) => constantProjectFields.reduce(withDissoc, resource);

const withoutStaffAndCampaigns = compose(dissoc(STAFF), dissoc(CAMPAIGNS));
