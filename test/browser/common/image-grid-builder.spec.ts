import {ImageGridBuilder} from '../../../app/components/imagegrid/image-grid-builder';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ImageGridBuilder', () => {

        let imageGridBuilder;

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


        beforeEach(function () {

            imageGridBuilder = new ImageGridBuilder();
        });


        it('should keep the aspect ration of an image', ()=> {

            const rows = imageGridBuilder.calcGrid(documents,4,800);

            expect(rows[0][0].calculatedWidth).toBe(rows[0][0].calculatedHeight * 2);
        });


        it('should throw when nrOfColumns not integer', () => {

            expect(function(){imageGridBuilder.calcGrid([],4.1,0)}).toThrow();
        });
    })
}
