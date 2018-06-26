import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {NavigationPath} from './navpath/navigation-path';
import {NavigationPathSegment} from './navpath/navigation-path-segment';
import {Document} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SegmentValidator {

    constructor(
        private datastore: IdaiFieldDocumentReadDatastore
    ) {}


    public async findInvalidSegment(
        mainTypeDocumentResourceId: string|undefined,
        navigationPath: NavigationPath): Promise<NavigationPathSegment|undefined> {

        for (let segment of navigationPath.segments) {
            if (!await this.isValidSegment(mainTypeDocumentResourceId, segment, navigationPath.segments)) {
                return segment;
            }
        }

        return undefined;
    }


    private async isValidSegment(
        mainTypeDocumentResourceId: string|undefined,
        segment: NavigationPathSegment,
        segments: Array<NavigationPathSegment>): Promise<boolean> {

        return await this.hasExistingDocument(segment)
            && SegmentValidator.hasValidRelation(mainTypeDocumentResourceId, segment, segments);
    }


    private async hasExistingDocument(segment: NavigationPathSegment): Promise<boolean> {

        return (await this.datastore.find({
            q: '',
            constraints: { 'id:match': segment.document.resource.id }
        })).totalCount !== 0;
    }


    private static hasValidRelation(mainTypeDocumentResourceId: string|undefined, segment: NavigationPathSegment, segments: Array<NavigationPathSegment>): boolean {

        const index: number = segments.indexOf(segment);

        return (index === 0)
            ? mainTypeDocumentResourceId !== undefined && Document.hasRelationTarget(segment.document,
            'isRecordedIn', mainTypeDocumentResourceId)
            : Document.hasRelationTarget(segment.document,
                'liesWithin', segments[index - 1].document.resource.id);
    }
}