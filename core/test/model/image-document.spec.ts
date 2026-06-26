import { ImageDocument } from '../../src/model';


describe('ImageDocument', () => {

    it('gets original file extension case-insensitively', () => {

        expect(ImageDocument.getOriginalFileExtension({
            resource: {
                originalFilename: 'Profile.JPG'
            }
        } as ImageDocument)).toBe('jpg');
    });


    it('returns an empty extension if original filename is missing', () => {

        expect(ImageDocument.getOriginalFileExtension({
            resource: {}
        } as ImageDocument)).toBe('');
    });


    it('returns an empty extension if original filename has no extension', () => {

        expect(ImageDocument.getOriginalFileExtension({
            resource: {
                originalFilename: 'Profile'
            }
        } as ImageDocument)).toBe('');
    });


    it('returns an empty extension if original filename ends with a dot', () => {

        expect(ImageDocument.getOriginalFileExtension({
            resource: {
                originalFilename: 'Profile.'
            }
        } as ImageDocument)).toBe('');
    });
});
