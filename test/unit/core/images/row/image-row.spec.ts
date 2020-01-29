import {ImageDocument} from 'idai-components-2';
import {ImageRow} from '../../../../../app/core/images/row/image-row';


describe('ImageRow', () => {

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
        expect(firstPageResult.positionLeft).toBe(0);
        // Show i1 and i2; i2 is not shown completely

        const secondPageResult = imageRow.nextPage();
        expect(secondPageResult.newImageIds).toEqual(['i3']);
        expect(secondPageResult.positionLeft).toBe(-200);
        // Show i2 and i3; i3 is not shown completely

        const thirdPageResult = imageRow.nextPage();
        expect(thirdPageResult.newImageIds).toEqual([]);
        expect(thirdPageResult.positionLeft).toBe(-450);
        // Show i3 (no new images)
    });
});