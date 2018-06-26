import {Document} from 'idai-components-2/core';
import {NavigationPathSegment} from './navigation-path-segment';
import {NavigationPath} from './navigation-path';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module SegmentValidator {

    export async function findInvalidSegment(
        mainTypeDocumentResourceId: string|undefined,
        navigationPath: NavigationPath,
        hasExisting: (_: string) => Promise<boolean>): Promise<NavigationPathSegment|undefined> {

        for (let segment of navigationPath.segments) {
            if (!await isValidSegment(
                mainTypeDocumentResourceId,
                    segment,
                    navigationPath.segments,
                    hasExisting)) {

                return segment;
            }
        }

        return undefined;
    }


    async function isValidSegment(
        mainTypeDocumentResourceId: string|undefined,
        segment: NavigationPathSegment,
        segments: Array<NavigationPathSegment>,
        hasExisting: (_: string) => Promise<boolean>): Promise<boolean> {

        return await hasExisting(segment.document.resource.id)
            && hasValidRelation(mainTypeDocumentResourceId, segment, segments);
    }


    function hasValidRelation(mainTypeDocumentResourceId: string|undefined, segment: NavigationPathSegment, segments: Array<NavigationPathSegment>): boolean {

        const index: number = segments.indexOf(segment);

        return (index === 0)
            ? mainTypeDocumentResourceId !== undefined && Document.hasRelationTarget(segment.document,
            'isRecordedIn', mainTypeDocumentResourceId)
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }
}