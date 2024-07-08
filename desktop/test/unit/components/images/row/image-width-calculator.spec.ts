import { ImageWidthCalculator } from '../../../../../src/app/components/image/row/image-width-calculator';


/**
 * @author Thomas Kleinke
 */
describe('ImageWidthCalculator', () => {

    test('calculate width', () => {

       expect(
           ImageWidthCalculator.computeWidth(200, 100, 50, 1000)
       ).toBe(100);

       expect(
           ImageWidthCalculator.computeWidth(50, 100, 200, 1000)
       ).toBe(100);
   });


   test('round results', () => {

       expect(
           ImageWidthCalculator.computeWidth(1900, 490, 50, 1000)
       ).toBe(194);
   });


   test('consider max width', () => {

        expect(
            ImageWidthCalculator.computeWidth(500, 100, 50, 100)
        ).toBe(100);


        expect(
            ImageWidthCalculator.computeWidth(500, 100, 50, 500)
        ).toBe(250);
    });
});
