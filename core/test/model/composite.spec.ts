import { Composite } from '../../src/model/input-types/composite';
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
});
