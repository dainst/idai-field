import {
    buildFieldHubFileUrl,
    buildFieldHubFileUrlWithType,
    getFieldHubBaseUrl,
    ImageVariant
} from '../../../src/datastore/image';


describe('Field Hub file URL helpers', () => {

    it('normalizes base and database sync URLs', () => {

        expect(getFieldHubBaseUrl('https://field.example', 'fieldwork'))
            .toBe('https://field.example');
        expect(getFieldHubBaseUrl('https://field.example/', 'fieldwork'))
            .toBe('https://field.example');
        expect(getFieldHubBaseUrl('https://field.example/db', 'fieldwork'))
            .toBe('https://field.example');
        expect(getFieldHubBaseUrl('https://field.example/db/fieldwork', 'fieldwork'))
            .toBe('https://field.example');
        expect(getFieldHubBaseUrl('https://field.example/db/field%20work', 'field work'))
            .toBe('https://field.example');
    });


    it('builds encoded project file URLs', () => {

        expect(buildFieldHubFileUrl('https://field.example/db', 'field work'))
            .toBe('https://field.example/files/field%20work');
        expect(buildFieldHubFileUrl('https://field.example/db', 'field work', 'photo 1'))
            .toBe('https://field.example/files/field%20work/photo%201');
    });


    it('builds typed file URLs for direct binary clients', () => {

        expect(buildFieldHubFileUrlWithType(
            'https://field.example/db/fieldwork',
            'fieldwork',
            'photo-1',
            ImageVariant.ORIGINAL
        )).toBe('https://field.example/files/fieldwork/photo-1?type=original_image');
    });
});
