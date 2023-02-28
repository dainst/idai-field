import { constructGrid } from '../../../../../src/app/components/image/grid/construct-grid';


/**
 * @author Daniel de Oliveira
 */
describe('constructGrid', () => {

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

        const rows = constructGrid(documents as any,4,800, 20);

        expect(rows[0][0].calculatedWidth).toBe(rows[0][0].calculatedHeight * 2);
    });


    it('should throw when nrOfColumns not integer', () => {

        expect(function(){constructGrid([],4.1,0, 20)}).toThrow();
    });
});
