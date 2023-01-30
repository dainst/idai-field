import { Dimension } from '../../src/model/dimension';


describe('Dimension', () => {

    it('translate back to original state', () => {

        const dim: Dimension = {
            inputValue: 100,
            inputUnit: 'cm',
            isImprecise: false
        };

        Dimension.addNormalizedValues(dim);
        expect(dim.value).not.toBeUndefined();

        const reverted = Dimension.revert(dim);
        expect(reverted['value']).toBeUndefined();
    });


    it('translate back to original state - range', () => {

        const dim: Dimension = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        Dimension.addNormalizedValues(dim);
        expect(dim.value).toBeUndefined();
        expect(dim.rangeMin).not.toBeUndefined();
        expect(dim.rangeMax).not.toBeUndefined();

        const reverted = Dimension.revert(dim);
        expect(reverted['rangeMin']).toBeUndefined();
        expect(reverted['rangeMax']).toBeUndefined();
    });


    it('isValid', () => {

        const dim: Dimension = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Dimension.isValid(dim)).toBeTruthy();
    });


    it('isValid - not valid', () => {

        const dim: any = {
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Dimension.isValid(dim)).toBeFalsy();
    });


    it('isValid - not valid - range with identical values', () => {

        const dim: any = {
            inputValue: 200,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Dimension.isValid(dim)).toBeFalsy();
    });


    it('isValid - not valid - negative values', () => {

        const dim: any = {
            inputValue: -200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Dimension.isValid(dim)).toBeFalsy();
    });


    it('isValid - not valid - permissive', () => {

        const dim: any = {
            inputValue: -200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Dimension.isValid(dim, { permissive: true })).toBeTruthy();
    });
});
