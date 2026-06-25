jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronPath: require('path'),
    electronRemote: undefined
}), { virtual: true });

import * as sharpModule from 'sharp';

import { ImageUploader } from '../../../src/app/components/image/upload/image-uploader';
import {
    createSoilColorAssistUpdatesForImageUpload,
    getNearestMunsellCandidates
} from '../../../src/app/util/korean-fieldwork-soil-color-photo-assist';


describe('Korean fieldwork soil color photo assist', () => {

    it('estimates Munsell candidates from uploaded soil profile images', async () => {

        const updates = await createSoilColorAssistUpdatesForImageUpload(
            'SoilProfilePhoto',
            await createSolidJpegBuffer({ red: 111, green: 87, blue: 61 })
        );

        expect(updates.soilColorAssistStatus).toBe('candidatesAvailable');
        expect(updates.soilColorAssistCandidates).toContain('1: 10YR 4/3');
        expect(updates.soilColorAssistCandidates).toContain('사진 중앙부 평균 RGB');
    });


    it('does not add candidates to non-soil-profile image categories', async () => {

        const updates = await createSoilColorAssistUpdatesForImageUpload(
            'Image',
            await createSolidJpegBuffer({ red: 111, green: 87, blue: 61 })
        );

        expect(updates).toEqual({});
    });


    it('returns nearest candidates for direct RGB samples', () => {

        const candidates = getNearestMunsellCandidates({
            blue: 88,
            green: 128,
            red: 139
        });

        expect(candidates[0].munsell).toBe('2.5Y 5/3');
        expect(candidates[0].confidence).toBe('high');
    });


    it('uses Korean field wording when uploaded color sampling fails', async () => {

        const updates = await createSoilColorAssistUpdatesForImageUpload(
            'SoilProfilePhoto',
            Buffer.from('not-an-image')
        );

        expect(updates.soilColorAssistStatus).toBe('lowConfidence');
        expect(updates.soilColorAssistCandidates).toContain('먼셀값');
        expect(updates.soilColorAssistCandidates).not.toContain('Munsell 값');
    });


    it('writes upload candidates only when the configured fields exist', async () => {

        const document: any = { resource: { category: 'SoilProfilePhoto' } };
        const uploader = new ImageUploader(
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            {
                getCategory: () => ({
                    groups: [{
                        name: 'koreanFieldwork',
                        fields: [
                            { name: 'soilColorAssistCandidates' },
                            { name: 'soilColorAssistStatus' }
                        ]
                    }]
                })
            } as any,
            undefined as any,
            undefined as any
        );

        await (uploader as any).setKoreanFieldworkSoilColorAssistFields(
            document,
            await createSolidJpegBuffer({ red: 111, green: 87, blue: 61 })
        );

        expect(document.resource.soilColorAssistStatus).toBe('candidatesAvailable');
        expect(document.resource.soilColorAssistCandidates).toContain('10YR 4/3');
    });
});


const createSolidJpegBuffer = (rgb: {
    blue: number;
    green: number;
    red: number;
}): Promise<Buffer> => getSharp()({
    create: {
        background: {
            alpha: 1,
            b: rgb.blue,
            g: rgb.green,
            r: rgb.red
        },
        channels: 4,
        height: 24,
        width: 24
    }
}).jpeg({ quality: 90 }).toBuffer();


function getSharp(): any {

    const candidate: any = sharpModule as any;

    return typeof candidate === 'function'
        ? candidate
        : candidate.default;
}
