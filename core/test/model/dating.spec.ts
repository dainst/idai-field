import { Dating } from '../../src/model/input-types/dating';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DatingUtil', () => {

    it('translate back to original state', () => {

        const dating: Dating = {
            type: 'single',
            begin: {
                inputYear: 2000,
                inputType: 'bce',
                year: undefined
            },
            isImprecise: false,
            isUncertain: false
        };

        Dating.addNormalizedValues(dating);
        expect(dating.begin.year).not.toBeUndefined();
        const reverted = Dating.revert(dating);
        expect(reverted.begin.year).toBeUndefined();
    });


    it('range translate back to original state', () => {

        const dating: Dating = {
            type: 'range',
            begin: {
                inputYear: 2000,
                inputType: 'bce',
                year: undefined
            },
            end: {
                inputYear: 1000,
                inputType: 'bce',
                year: undefined
            },
            isImprecise: false,
            isUncertain: false
        };

        Dating.addNormalizedValues(dating);
        expect(dating.begin.year).not.toBeUndefined();
        expect(dating.end.year).not.toBeUndefined();
        const reverted = Dating.revert(dating);
        expect(reverted.begin.year).toBeUndefined();
        expect(reverted.end.year).toBeUndefined();
    });


    it('remove empty field', () => {

        const dating: Dating = {
            type: 'single',
            begin: {
                inputYear: 2000,
                inputType: 'bce',
                year: -2001
            },
            isImprecise: false,
            isUncertain: false
        };
        delete dating.begin.inputYear;
        delete dating.begin.inputType;

        const reverted = Dating.revert(dating);
        expect(reverted.begin).toBeUndefined();
    });


    it('validate range datings', () => {

        const validDating: Dating = {
            type: 'range',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            end: { inputYear: 1100, inputType: 'ce', year: 1100 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating1: Dating = {
            type: 'range',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating2: Dating = {
            type: 'range',
            end: { inputYear: 1100, inputType: 'ce', year: 1100 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating3: Dating = {
            type: 'range',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            end: { inputYear: 1100, inputType: 'ce', year: 1100 },
            isImprecise: false,
            isUncertain: false,
            margin: 10
        };

        expect(Dating.isValid(validDating)).toBe(true);
        expect(Dating.isValid(invalidDating1)).toBe(false);
        expect(Dating.isValid(invalidDating2)).toBe(false);
        expect(Dating.isValid(invalidDating3)).toBe(false);
    });


    it('validate single and before datings', () => {

        for (let type of ['single', 'before'] as Array<Dating.Type>) {
            const validDating: Dating = {
                type,
                end: { inputYear: 1000, inputType: 'ce', year: 1000 },
                isImprecise: false,
                isUncertain: false
            };

            const invalidDating1: Dating = {
                type,
                begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
                end: { inputYear: 1100, inputType: 'ce', year: 1100 },
                isImprecise: false,
                isUncertain: false
            };

            const invalidDating2: Dating = {
                type,
                isImprecise: false,
                isUncertain: false
            };

            const invalidDating3: Dating = {
                type,
                end: { inputYear: 1100, inputType: 'ce', year: 1100 },
                isImprecise: false,
                isUncertain: false,
                margin: 10
            };

            expect(Dating.isValid(validDating)).toBe(true);
            expect(Dating.isValid(invalidDating1)).toBe(false);
            expect(Dating.isValid(invalidDating2)).toBe(false);
            expect(Dating.isValid(invalidDating3)).toBe(false);
        }
    });


    it('validate after datings', () => {

        const validDating: Dating = {
            type: 'after',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating1: Dating = {
            type: 'after',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            end: { inputYear: 1100, inputType: 'ce', year: 1100 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating2: Dating = {
            type: 'after',
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating3: Dating = {
            type: 'after',
            begin: { inputYear: 1000, inputType: 'ce', year: 1000 },
            isImprecise: false,
            isUncertain: false,
            margin: 10
        };

        expect(Dating.isValid(validDating)).toBe(true);
        expect(Dating.isValid(invalidDating1)).toBe(false);
        expect(Dating.isValid(invalidDating2)).toBe(false);
        expect(Dating.isValid(invalidDating3)).toBe(false);
    });


    it('validate scientific datings', () => {

        const validDating: Dating = {
            type: 'scientific',
            begin: { inputYear: 1000, inputType: 'ce', year: 9990 },
            end: { inputYear: 1000, inputType: 'ce', year: 1010 },
            margin: 10,
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating1: Dating = {
            type: 'scientific',
            begin: { inputYear: 1000, inputType: 'ce', year: 9990 },
            margin: 10,
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating2: Dating = {
            type: 'scientific',
            end: { inputYear: 1000, inputType: 'ce', year: 1010 },
            margin: 10,
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating3: Dating = {
            type: 'scientific',
            begin: { inputYear: 1000, inputType: 'ce', year: 9990 },
            end: { inputYear: 1000, inputType: 'ce', year: 1010 },
            isImprecise: false,
            isUncertain: false
        };

        const invalidDating4: Dating = {
            type: 'scientific',
            begin: { inputYear: 1000, inputType: 'ce', year: 9990 },
            end: { inputYear: 1000, inputType: 'ce', year: 1010 },
            margin: 10,
            isImprecise: true,
            isUncertain: false
        };

        const invalidDating5: Dating = {
            type: 'scientific',
            begin: { inputYear: 1000, inputType: 'ce', year: 9990 },
            end: { inputYear: 1000, inputType: 'ce', year: 1010 },
            margin: 10,
            isImprecise: false,
            isUncertain: true
        };

        expect(Dating.isValid(validDating)).toBe(true);
        expect(Dating.isValid(invalidDating1)).toBe(false);
        expect(Dating.isValid(invalidDating2)).toBe(false);
        expect(Dating.isValid(invalidDating3)).toBe(false);
        expect(Dating.isValid(invalidDating4)).toBe(false);
        expect(Dating.isValid(invalidDating5)).toBe(false);
    });


    it('validate deprecated dating via label', () => {

        const validDating: Dating = {
            label: 'Test'
        } as Dating;

        expect(Dating.isValid(validDating)).toBe(true);
    });
});
