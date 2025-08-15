import { Field } from '../../src/model/configuration/field';
import { Measurement } from '../../src/model/input-types/measurement';


describe('Measurement', () => {

    it('normalize dimension value: mm', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'mm',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000);
    });


    it('normalize dimension value: cm', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'cm',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(10000);
    });


    it('normalize dimension value: m', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'm',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000000);
    });


    it('normalize weight value: mg', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'mg',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000);
    });


    it('normalize weight value: g', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'g',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000000);
    });


    it('normalize weight value: kg', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'kg',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000000000);
    });


    it('normalize volume value: ml', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'ml',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000);
    });


    it('normalize volume value: l', () => {

        const measurement: Measurement = {
            inputValue: 1,
            inputUnit: 'l',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBe(1000000);
    });


    it('translate back to original state', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputUnit: 'cm',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).not.toBeUndefined();

        const reverted = Measurement.revert(measurement);
        expect(reverted['value']).toBeUndefined();
    });


    it('translate back to original state - range', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        Measurement.addNormalizedValues(measurement);
        expect(measurement.value).toBeUndefined();
        expect(measurement.rangeMin).not.toBeUndefined();
        expect(measurement.rangeMax).not.toBeUndefined();

        const reverted = Measurement.revert(measurement);
        expect(reverted['rangeMin']).toBeUndefined();
        expect(reverted['rangeMax']).toBeUndefined();
    });


    it('is valid dimension', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION)).toBeTruthy();
    });


    it('is valid weight', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'g',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.WEIGHT)).toBeTruthy();
    });


     it('is valid volume', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'l',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.VOLUME)).toBeTruthy();
    });


    it('is not a valid dimension', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'l',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION)).toBeFalsy();
    });


    it('is not a valid weight', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.WEIGHT)).toBeFalsy();
    });


    it('is not a valid volume', () => {

        const measurement: Measurement = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'g',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.VOLUME)).toBeFalsy();
    });


    it('is not valid: missing start value', () => {

        const measurement: any = {
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION)).toBeFalsy();
    });


    it('is not valid: range with identical values', () => {

        const measurement: any = {
            inputValue: 200,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION)).toBeFalsy();
    });


    it('is not valid: negative value', () => {

        const measurement: any = {
            inputValue: -200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION)).toBeFalsy();
    });


    it('is valid: negative value but permissive', () => {

        const measurement: any = {
            inputValue: -200,
            inputUnit: 'cm',
            isImprecise: false
        };

        expect(Measurement.isValid(measurement, Field.InputType.DIMENSION, { permissive: true })).toBeTruthy();
    });
});
