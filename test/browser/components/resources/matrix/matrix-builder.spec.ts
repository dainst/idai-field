import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Static} from '../../../helper/static';
import {MatrixBuilder} from '../../../../../app/components/matrix/matrix-builder';
import {Matrix} from '../../../../../app/components/matrix/matrix';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('MatrixBuilder', () => {

        const matrixBuilder: MatrixBuilder = new MatrixBuilder();


        it('build simple matrix', () => {

            const feature1: IdaiFieldDocument = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
            const feature2: IdaiFieldDocument = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
            const feature3: IdaiFieldDocument = Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');

            feature1.resource.relations['isAfter'] = ['f2'];
            feature2.resource.relations['isAfter'] = ['f3'];

            feature2.resource.relations['isBefore'] = ['f1'];
            feature3.resource.relations['isBefore'] = ['f2'];

            const matrix: Matrix = matrixBuilder.build([feature1, feature2, feature3]);

            console.log(JSON.stringify(matrix));

            expect(matrix.rows.length).toBe(3);
            expect(matrix.rows[0].length).toBe(1);
            expect(matrix.rows[1].length).toBe(1);
            expect(matrix.rows[2].length).toBe(1);
        });

    });
}