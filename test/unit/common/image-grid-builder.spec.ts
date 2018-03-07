import {ImageGridConstruction} from '../../../app/components/imagegrid/image-grid-builder';

/**
 * @author Daniel de Oliveira
 */
describe('ImageGridConstruction', () => {

    const documents = [{
        id: 'o1',
        resource: {
            id: 'o1',
            identifier:'ob1',
            shortDescription:'name',
            height: '1',
            width: '2',
            originalFilename: 'abc'
        }
    }];


    it('should keep the aspect ration of an image', ()=> {

        const rows = ImageGridConstruction.calcGrid(documents as any,4,800);

        expect(rows[0][0].calculatedWidth).toBe(rows[0][0].calculatedHeight * 2);
    });


    it('should throw when nrOfColumns not integer', () => {

        expect(function(){ImageGridConstruction.calcGrid([],4.1,0)}).toThrow();
    });
});
