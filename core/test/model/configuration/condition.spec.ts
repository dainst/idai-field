import { Condition } from '../../../src/model/configuration/condition';
import { Field, Subfield } from '../../../src/model/configuration/field';


/**
 * @author Thomas Kleinke
 */
describe('Condition', () => {

    it('check boolean condition for fields', () => {

        const fields: Array<Field> = [
            {
                name: 'field1',
                inputType: 'boolean'
            },
            {
                name: 'field2',
                inputType: 'text',
                condition: {
                    fieldName: 'field1',
                    values: false
                }
            }
        ];
    
        expect(Condition.isFulfilled(fields[1].condition, { field1: false }, fields, 'field')).toBe(true);
        expect(Condition.isFulfilled(fields[1].condition, { field1: true }, fields, 'field')).toBe(false);
        expect(Condition.isFulfilled(fields[1].condition, {}, fields, 'field')).toBe(false);
    });


    it('check boolean condition for subfields', () => {

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
    
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: false }, subfields, 'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: true }, subfields, 'subfield')).toBe(false);
        expect(Condition.isFulfilled(subfields[1].condition, {}, subfields, 'subfield')).toBe(false);
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

        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: 'value1' }, subfields, 'subfield'))
            .toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: 'value2' }, subfields, 'subfield'))
            .toBe(false);
        expect(Condition.isFulfilled(subfields[1].condition, {}, subfields, 'subfield')).toBe(false);
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

        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value1'] }, subfields, 'subfield'))
            .toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value1', 'value2'] }, subfields,
            'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value2', 'value3'] }, subfields,
            'subfield')).toBe(false);
        expect(Condition.isFulfilled(subfields[1].condition, {}, subfields, 'subfield')).toBe(false);
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
    
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: 'value1' }, subfields, 'subfield'))
            .toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: 'value2' }, subfields, 'subfield'))
            .toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: 'value3' }, subfields, 'subfield'))
            .toBe(false);
        expect(Condition.isFulfilled(subfields[1].condition, {}, subfields, 'subfield')).toBe(false);
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
    
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value1', 'values2'] },
            subfields, 'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value1', 'values2', 'value3'] },
            subfields, 'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value2', 'values3'] },
            subfields, 'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value2'] },
            subfields, 'subfield')).toBe(true);
        expect(Condition.isFulfilled(subfields[1].condition, { subfield1: ['value3', 'values4'] },
            subfields, 'subfield')).toBe(false);
        expect(Condition.isFulfilled(subfields[1].condition, {}, subfields, 'subfield')).toBe(false);
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
    

        expect(Condition.isFulfilled(subfields[2].condition, { subfield1: true, subfield2: false }, subfields, 'subfield'))
            .toBe(true);
        expect(Condition.isFulfilled(subfields[2].condition, { subfield1: true, subfield2: true }, subfields, 'subfield'))
            .toBe(false);
        expect(Condition.isFulfilled(subfields[2].condition, { subfield1: false }, subfields, 'subfield'))
            .toBe(false);
        expect(Condition.isFulfilled(subfields[2].condition, { subfield1: false, subfield2: false }, subfields, 'subfield'))
            .toBe(false);
        expect(Condition.isFulfilled(subfields[2].condition, { subfield1: false, subfield2: true }, subfields, 'subfield'))
            .toBe(false);
    });
});
