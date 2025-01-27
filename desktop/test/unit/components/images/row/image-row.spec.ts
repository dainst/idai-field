import { ImageDocument } from 'idai-field-core';
import { ImageRow } from '../../../../../src/app/components/image/row/image-row';


describe('ImageRow', () => {

    const imageDocuments = [
        {
            resource: {
                type: 'Drawing', id: 'i1', identifier: 'I1', width: 200, height: 100,
                relations: { depicts: [] }
            }
        },
        {
            resource: {
                type: 'Drawing', id: 'i2', identifier: 'I2', width: 250, height: 100,
                relations: { depicts: [] }
            }
        },
        {
            resource: {
                type: 'Drawing', id: 'i3', identifier: 'I3', width: 150, height: 100,
                relations: { depicts: [] }
            }
        }
    ] as unknown as Array<ImageDocument>;


    test('switch pages', () => {

        const imageRow = new ImageRow(300, 100, 300, imageDocuments);

        let result = imageRow.nextPage();
        expect(result.newImageIds).toEqual(['i1', 'i2']);
        expect(result.firstShownImageIndex).toBe(0);
        // Show i1 and i2; i2 is not shown completely

        result = imageRow.nextPage();
        expect(result.newImageIds).toEqual(['i3']);
        expect(result.firstShownImageIndex).toBe(1);
        // Show i2 and i3; i3 is not shown completely

        result = imageRow.nextPage();
        expect(result.newImageIds).toEqual([]);
        expect(result.firstShownImageIndex).toBe(2);
        // Show i3

        result = imageRow.previousPage();
        expect(result.newImageIds).toEqual([]);
        expect(result.firstShownImageIndex).toBe(1);
        // Show i2 and i3; i3 is not shown completely

        result = imageRow.previousPage();
        expect(result.newImageIds).toEqual([]);
        expect(result.firstShownImageIndex).toBe(0);
        // Show i1 and i2; i2 is not shown completely

        result = imageRow.nextPage();
        expect(result.newImageIds).toEqual([]);
        expect(result.firstShownImageIndex).toBe(1);
        // Show i2 and i3; i3 is not shown completely
    });


    test('switch pages to show selected image', () => {

        const imageRow = new ImageRow(300, 100, 300, imageDocuments);

        let result = imageRow.nextPage();
        expect(result.newImageIds).toEqual(['i1', 'i2']);
        expect(result.firstShownImageIndex).toBe(0);
        // Show i1 and i2; i2 is not shown completely

        result = imageRow.switchToSelected({ imageId: 'i3', document: null });
        expect(result.newImageIds).toEqual(['i3']);
        expect(result.firstShownImageIndex).toBe(2);
        // Show i3
    });


    test('change width', () => {

        const imageRow = new ImageRow(150, 100, 300, imageDocuments);

        let result = imageRow.nextPage();
        expect(result.newImageIds).toEqual(['i1']);
        expect(result.firstShownImageIndex).toBe(0);
        // Show i1

        result = imageRow.setWidth(300);
        expect(result.newImageIds).toEqual(['i2']);
        expect(result.firstShownImageIndex).toBe(0);
        // Show i1 and i2; i2 is not shown completely
    });


    test('return correct values for hasNextPage and hasPreviousPage', () => {

        const imageRow = new ImageRow(300, 100, 300, imageDocuments);

        imageRow.nextPage();
        expect(imageRow.hasPreviousPage()).toBe(false);
        expect(imageRow.hasNextPage()).toBe(true);

        imageRow.nextPage();
        expect(imageRow.hasPreviousPage()).toBe(true);
        expect(imageRow.hasNextPage()).toBe(true);

        imageRow.nextPage();
        expect(imageRow.hasPreviousPage()).toBe(true);
        expect(imageRow.hasNextPage()).toBe(false);

        imageRow.previousPage();
        expect(imageRow.hasPreviousPage()).toBe(true);
        expect(imageRow.hasNextPage()).toBe(true);

        imageRow.previousPage();
        expect(imageRow.hasPreviousPage()).toBe(false);
        expect(imageRow.hasNextPage()).toBe(true);
    });
});
