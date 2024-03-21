import { Composite } from '../../src/model/composite';
import { Subfield } from '../../src/model/configuration/field';


/**
 * @author Thomas Kleinke
 */
describe('Composite', () => {

    it('validate composite field entry', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'int'
            },
            {
                name: 'subfield2',
                inputType: 'boolean'
            },
            {
                name: 'subfield3',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield2',
                    values: false
                }
            }
        ];

        expect(Composite.isValid({ subfield1: 1, subfield2: false, subfield3: 'test' }, subfields)).toBe(true);
        expect(Composite.isValid({ subfield1: 1 }, subfields)).toBe(true);
        expect(Composite.isValid({ subfield1: 1.5, subfield2: false, subfield3: 'test' }, subfields)).toBe(false);
        expect(Composite.isValid({ subfield1: 1, subfield2: true, subfield3: 'test' }, subfields)).toBe(false);
        expect(Composite.isValid({ subfield1: 1, subfield2: false, subfield3: 1 }, subfields)).toBe(false);
        expect(Composite.isValid({ subfield1: 'test', subfield2: false, subfield3: 'test' }, subfields)).toBe(false);
        expect(Composite.isValid({ subfield1: 1, unconfiguredSubfield: 'test' }, subfields)).toBe(false);
    });


    it('check boolean condition', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'boolean'
            },
            {
                name: 'subfield2',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield1',
                    values: false
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: false }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: true }, subfields[1], subfields)).toBe(false);
        expect(Composite.isConditionFulfilled({}, subfields[1], subfields)).toBe(false);
    });


    it('check single value condition for dropdown subfield', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'dropdown'
            },
            {
                name: 'subfield2',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield1',
                    values: ['value1']
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: 'value1' }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: 'value2' }, subfields[1], subfields)).toBe(false);
        expect(Composite.isConditionFulfilled({}, subfields[1], subfields)).toBe(false);
    });


    it('check single value condition for checkboxes subfield', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'checkboxes'
            },
            {
                name: 'subfield2',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield1',
                    values: ['value1']
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: ['value1'] }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value1', 'value2'] }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value2', 'value3'] }, subfields[1], subfields)).toBe(false);
        expect(Composite.isConditionFulfilled({}, subfields[1], subfields)).toBe(false);
    });


    it('check multiple values condition for dropdown subfield', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'dropdown'
            },
            {
                name: 'subfield2',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield1',
                    values: ['value1', 'value2']
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: 'value1' }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: 'value2' }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: 'value3' }, subfields[1], subfields)).toBe(false);
        expect(Composite.isConditionFulfilled({}, subfields[1], subfields)).toBe(false);
    });


    it('check multiple values condition for checkboxes subfield', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'checkboxes'
            },
            {
                name: 'subfield2',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield1',
                    values: ['value1', 'value2']
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: ['value1', 'values2'] }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value1', 'values2', 'value3'] }, subfields[1], subfields))
            .toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value2', 'values3'] }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value2'] }, subfields[1], subfields)).toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: ['value3', 'values4'] }, subfields[1], subfields)).toBe(false);
        expect(Composite.isConditionFulfilled({}, subfields[1], subfields)).toBe(false);
    });

    
    it('check chained condition', () => {

        const subfields: Array<Subfield> = [
            {
                name: 'subfield1',
                inputType: 'boolean'
            },
            {
                name: 'subfield2',
                inputType: 'boolean',
                condition: {
                    subfieldName: 'subfield1',
                    values: true
                }
            },
            {
                name: 'subfield3',
                inputType: 'text',
                condition: {
                    subfieldName: 'subfield2',
                    values: false
                }
            }
        ];

        expect(Composite.isConditionFulfilled({ subfield1: true, subfield2: false }, subfields[2], subfields))
            .toBe(true);
        expect(Composite.isConditionFulfilled({ subfield1: true, subfield2: true }, subfields[2], subfields))
            .toBe(false);
        expect(Composite.isConditionFulfilled({ subfield1: false }, subfields[2], subfields))
            .toBe(false);
        expect(Composite.isConditionFulfilled({ subfield1: false, subfield2: false }, subfields[2], subfields))
            .toBe(false);
        expect(Composite.isConditionFulfilled({ subfield1: false, subfield2: true }, subfields[2], subfields))
            .toBe(false);
    });
});
