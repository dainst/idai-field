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

            feature1.resource.relations['isAfter'] = ['f2'];
            feature2.resource.relations['isBefore'] = ['f1'];

            const matrix: Matrix = matrixBuilder.build([feature1, feature2]);

            expect(matrix.rows.length).toBe(2);
            expect(matrix.rows[0].length).toBe(1);
            expect(matrix.rows[1].length).toBe(1);
            expect(matrix.rows[0][0]).toBe(feature1);
            expect(matrix.rows[1][0]).toBe(feature2);
        });


        it('build matrix with multiple children', () => {

            const feature1: IdaiFieldDocument = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
            const feature2: IdaiFieldDocument = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
            const feature3: IdaiFieldDocument = Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');

            feature1.resource.relations['isAfter'] = ['f2', 'f3'];

            feature2.resource.relations['isBefore'] = ['f1'];
            feature3.resource.relations['isBefore'] = ['f1'];

            const matrix: Matrix = matrixBuilder.build([feature1, feature2, feature3]);

            expect(matrix.rows.length).toBe(2);
            expect(matrix.rows[0].length).toBe(2);
            expect(matrix.rows[1].length).toBe(3);
            expect(matrix.rows[0][0]).toBeUndefined();
            expect(matrix.rows[0][1]).toBe(feature1);
            expect(matrix.rows[1][0]).toBe(feature2);
            expect(matrix.rows[1][1]).toBeUndefined();
            expect(matrix.rows[1][2]).toBe(feature3);
        });


        it('build diamond formed matrix', () => {

            const feature1: IdaiFieldDocument = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
            const feature2: IdaiFieldDocument = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
            const feature3: IdaiFieldDocument = Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
            const feature4: IdaiFieldDocument = Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');

            feature1.resource.relations['isAfter'] = ['f2', 'f3'];
            feature2.resource.relations['isAfter'] = ['f4'];
            feature3.resource.relations['isAfter'] = ['f4'];

            feature2.resource.relations['isBefore'] = ['f1'];
            feature3.resource.relations['isBefore'] = ['f1'];
            feature4.resource.relations['isBefore'] = ['f2', 'f3'];

            const matrix: Matrix = matrixBuilder.build([feature1, feature2, feature3, feature4]);

            expect(matrix.rows.length).toBe(3);
            expect(matrix.rows[0].length).toBe(2);
            expect(matrix.rows[1].length).toBe(3);
            expect(matrix.rows[2].length).toBe(2);
            expect(matrix.rows[0][0]).toBeUndefined();
            expect(matrix.rows[0][1]).toBe(feature1);
            expect(matrix.rows[1][0]).toBe(feature2);
            expect(matrix.rows[1][1]).toBeUndefined();
            expect(matrix.rows[1][2]).toBe(feature3);
            expect(matrix.rows[2][0]).toBeUndefined();
            expect(matrix.rows[2][1]).toBe(feature4);
        });


        it('prevent two documents from occupying the same space', () => {

            const feature1: IdaiFieldDocument = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
            const feature2: IdaiFieldDocument = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
            const feature3: IdaiFieldDocument = Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
            const feature4: IdaiFieldDocument = Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
            const feature5: IdaiFieldDocument = Static.idfDoc('Feature 5', 'feature5', 'Feature', 'f5');
            const feature6: IdaiFieldDocument = Static.idfDoc('Feature 6', 'feature6', 'Feature', 'f6');

            feature1.resource.relations['isAfter'] = ['f2', 'f5', 'f3'];
            feature2.resource.relations['isAfter'] = ['f4'];
            feature3.resource.relations['isAfter'] = ['f4'];
            feature5.resource.relations['isAfter'] = ['f6'];

            feature2.resource.relations['isBefore'] = ['f1'];
            feature3.resource.relations['isBefore'] = ['f1'];
            feature4.resource.relations['isBefore'] = ['f2', 'f3'];
            feature5.resource.relations['isBefore'] = ['f1'];
            feature6.resource.relations['isBefore'] = ['f5'];

            const matrix: Matrix = matrixBuilder.build([
                feature1, feature2, feature3, feature4, feature5, feature6
            ]);

            expect(matrix.rows.length).toBe(4);
            expect(matrix.rows[0].length).toBe(2);
            expect(matrix.rows[1].length).toBe(3);
            expect(matrix.rows[2].length).toBe(2);
            expect(matrix.rows[3].length).toBe(2);
            expect(matrix.rows[0][0]).toBeUndefined();
            expect(matrix.rows[0][1]).toBe(feature1);
            expect(matrix.rows[1][0]).toBe(feature2);
            expect(matrix.rows[1][1]).toBe(feature5);
            expect(matrix.rows[1][2]).toBe(feature3);
            expect(matrix.rows[2][0]).toBeUndefined();
            expect(matrix.rows[2][1]).toBe(feature6);
            expect(matrix.rows[3][0]).toBeUndefined();
            expect(matrix.rows[3][1]).toBe(feature4);
        });


        it('build complicated matrix', () => {

            const feature1: IdaiFieldDocument = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
            const feature2: IdaiFieldDocument = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
            const feature3: IdaiFieldDocument = Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
            const feature4: IdaiFieldDocument = Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
            const feature5: IdaiFieldDocument = Static.idfDoc('Feature 5', 'feature5', 'Feature', 'f5');
            const feature6: IdaiFieldDocument = Static.idfDoc('Feature 6', 'feature6', 'Feature', 'f6');
            const feature7: IdaiFieldDocument = Static.idfDoc('Feature 7', 'feature7', 'Feature', 'f7');
            const feature8: IdaiFieldDocument = Static.idfDoc('Feature 8', 'feature8', 'Feature', 'f8');
            const feature9: IdaiFieldDocument = Static.idfDoc('Feature 9', 'feature9', 'Feature', 'f9');
            const feature10: IdaiFieldDocument = Static.idfDoc('Feature 10', 'feature10', 'Feature', 'f10');
            const feature11: IdaiFieldDocument = Static.idfDoc('Feature 11', 'feature11', 'Feature', 'f11');
            const feature12: IdaiFieldDocument = Static.idfDoc('Feature 12', 'feature12', 'Feature', 'f12');
            const feature13: IdaiFieldDocument = Static.idfDoc('Feature 13', 'feature13', 'Feature', 'f13');
            const feature14: IdaiFieldDocument = Static.idfDoc('Feature 14', 'feature14', 'Feature', 'f14');

            feature1.resource.relations['isAfter'] = ['f2', 'f3', 'f4', 'f5', 'f6'];
            feature2.resource.relations['isAfter'] = ['f7', 'f8'];
            feature5.resource.relations['isAfter'] = ['f9'];
            feature6.resource.relations['isAfter'] = ['f10', 'f11', 'f12'];
            feature8.resource.relations['isAfter'] = ['f13'];
            feature10.resource.relations['isAfter'] = ['f13'];
            feature13.resource.relations['isAfter'] = ['f14'];

            feature2.resource.relations['isBefore'] = ['f1'];
            feature3.resource.relations['isBefore'] = ['f1'];
            feature4.resource.relations['isBefore'] = ['f1'];
            feature5.resource.relations['isBefore'] = ['f1'];
            feature6.resource.relations['isBefore'] = ['f1'];
            feature7.resource.relations['isBefore'] = ['f2'];
            feature8.resource.relations['isBefore'] = ['f2'];
            feature9.resource.relations['isBefore'] = ['f5'];
            feature10.resource.relations['isBefore'] = ['f6'];
            feature11.resource.relations['isBefore'] = ['f6'];
            feature12.resource.relations['isBefore'] = ['f6'];
            feature13.resource.relations['isBefore'] = ['f8', 'f10'];
            feature14.resource.relations['isBefore'] = ['f13'];

            const matrix: Matrix = matrixBuilder.build([
                feature1, feature2, feature3, feature4,
                feature5, feature6, feature7, feature8,
                feature9, feature10, feature11, feature12,
                feature13, feature14]);

            expect(matrix.rows.length).toBe(5);
            expect(matrix.rows[0].length).toBe(5);
            expect(matrix.rows[1].length).toBe(8);
            expect(matrix.rows[2].length).toBe(9);
            expect(matrix.rows[3].length).toBe(5);
            expect(matrix.rows[4].length).toBe(5);
            expect(matrix.rows[0][0]).toBeUndefined();
            expect(matrix.rows[0][1]).toBeUndefined();
            expect(matrix.rows[0][2]).toBeUndefined();
            expect(matrix.rows[0][3]).toBeUndefined();
            expect(matrix.rows[0][4]).toBe(feature1);
            expect(matrix.rows[1][0]).toBeUndefined();
            expect(matrix.rows[1][1]).toBe(feature2);
            expect(matrix.rows[1][2]).toBeUndefined();
            expect(matrix.rows[1][3]).toBe(feature3);
            expect(matrix.rows[1][4]).toBe(feature4);
            expect(matrix.rows[1][5]).toBe(feature5);
            expect(matrix.rows[1][6]).toBeUndefined();
            expect(matrix.rows[1][7]).toBe(feature6);
            expect(matrix.rows[2][0]).toBe(feature7);
            expect(matrix.rows[2][1]).toBeUndefined();
            expect(matrix.rows[2][2]).toBe(feature8);
            expect(matrix.rows[2][3]).toBeUndefined();
            expect(matrix.rows[2][4]).toBeUndefined();
            expect(matrix.rows[2][5]).toBe(feature9);
            expect(matrix.rows[2][6]).toBe(feature10);
            expect(matrix.rows[2][7]).toBe(feature11);
            expect(matrix.rows[2][8]).toBe(feature12);
            expect(matrix.rows[3][0]).toBeUndefined();
            expect(matrix.rows[3][1]).toBeUndefined();
            expect(matrix.rows[3][2]).toBeUndefined();
            expect(matrix.rows[3][3]).toBeUndefined();
            expect(matrix.rows[3][4]).toBe(feature13);
            expect(matrix.rows[4][0]).toBeUndefined();
            expect(matrix.rows[4][1]).toBeUndefined();
            expect(matrix.rows[4][2]).toBeUndefined();
            expect(matrix.rows[4][3]).toBeUndefined();
            expect(matrix.rows[4][4]).toBe(feature14);
        });
    });
}