import { Dating } from '../../src/model/input-types/dating';


/**
 * @author Daniel de Oliveira
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
});
