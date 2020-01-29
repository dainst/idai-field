import {ImageDocument} from 'idai-components-2';
import {ImageRow} from '../../../../../app/core/images/row/image-row';


describe('ImageRow', () => {

    it('show a page', () => {

        const imageDocuments = [
            {
                resource: {
                    type: 'Drawing', id: 'i1', identifier: 'I1', width: 100,
                    height: 100, relations: { depicts: [] }
                }
            }
        ] as unknown as Array<ImageDocument>;

        const imageRow = new ImageRow(1000, 100, 100, imageDocuments);

        const nextPageResult = imageRow.nextPage();
        expect(nextPageResult.newImageIds).toEqual(['i1']);
        expect(nextPageResult.scrollWidth).toBe(0);
    });


    it('switch pages', () => {

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

        const imageRow = new ImageRow(300, 100, 300, imageDocuments);

        const firstPageResult = imageRow.nextPage();
        expect(firstPageResult.newImageIds).toEqual(['i1', 'i2']);
        expect(firstPageResult.scrollWidth).toBe(0);
        // Show i1 and i2; i2 is not shown completely

        const secondPageResult = imageRow.nextPage();
        expect(secondPageResult.newImageIds).toEqual(['i3']);
        expect(secondPageResult.scrollWidth).toBe(200);
        // Show i2 and i3; i3 is not shown completely

        const thirdPageResult = imageRow.nextPage();
        expect(thirdPageResult.newImageIds).toEqual([]);
        expect(thirdPageResult.scrollWidth).toBe(250);
        // Show i3 (no new images)
    });
});