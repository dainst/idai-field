import { Document } from 'idai-field-core';
import { getKoreanFieldworkEvidenceChips } from '../../../src/app/util/korean-fieldwork-record-evidence';


describe('korean-fieldwork-record-evidence', () => {

    it('summarizes field evidence attached to a feature record', () => {

        const feature = createDocument('feature-1', 'Feature', '수혈 1');
        const pit = createDocument('pit-1', 'FeatureSegment', '피트 1', {
            liesWithin: ['feature-1']
        });
        const layer = createDocument('layer-1', 'Layer', '토층 1', {
            liesWithin: ['feature-1']
        });
        const photo = createDocument('photo-1', 'Photo', '사진 1', {
            depicts: ['feature-1']
        });
        const sketch = createDocument('sketch-1', 'PenMemo', '약도 1', {
            depicts: ['feature-1']
        });
        const sample = createDocument('sample-1', 'Sample', '시료 1', {
            liesWithin: ['feature-1']
        });
        const chips = getKoreanFieldworkEvidenceChips(feature, [
            feature,
            pit,
            layer,
            photo,
            sketch,
            sample
        ] as any);

        expect(chips.map(chip => ({
            id: chip.id,
            label: chip.label,
            count: chip.count,
            tone: chip.tone,
            createCategoryName: chip.createCategoryName,
            documentIds: chip.documents.map(document => document.resource.id)
        }))).toEqual([
            {
                id: 'featureSegments',
                label: '피트',
                count: 1,
                tone: 'filled',
                createCategoryName: 'FeatureSegment',
                documentIds: ['pit-1']
            },
            {
                id: 'layers',
                label: '토색 메모',
                count: 1,
                tone: 'filled',
                createCategoryName: undefined,
                documentIds: ['layer-1']
            },
            {
                id: 'photos',
                label: '사진',
                count: 1,
                tone: 'filled',
                createCategoryName: 'Photo',
                documentIds: ['photo-1']
            },
            {
                id: 'soilProfilePhotos',
                label: '토층사진',
                count: 0,
                tone: 'empty',
                createCategoryName: 'SoilProfilePhoto',
                documentIds: []
            },
            {
                id: 'drawings',
                label: '도면',
                count: 0,
                tone: 'empty',
                createCategoryName: 'Drawing',
                documentIds: []
            },
            {
                id: 'sketches',
                label: '약도·스케치',
                count: 1,
                tone: 'filled',
                createCategoryName: 'PenMemo',
                documentIds: ['sketch-1']
            },
            {
                id: 'finds',
                label: '유물',
                count: 0,
                tone: 'empty',
                createCategoryName: 'Find',
                documentIds: []
            },
            {
                id: 'samples',
                label: '시료',
                count: 1,
                tone: 'filled',
                createCategoryName: 'Sample',
                documentIds: ['sample-1']
            }
        ]);
    });


    it('keeps non-structural evidence records compact in the record list', () => {

        expect(getKoreanFieldworkEvidenceChips(
            createDocument('photo-1', 'Photo', '사진 1') as any,
            []
        )).toEqual([]);
    });
});


const createDocument = (
        id: string,
        category: string,
        identifier: string,
        relations: Record<string, string[]> = {}
): Document => ({
    resource: {
        id,
        identifier,
        category,
        relations
    }
} as Document);
