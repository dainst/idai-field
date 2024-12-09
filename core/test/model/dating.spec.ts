import { Dating } from '../../src/model/input-types/dating';


/**
 * @author Daniel de Oliveira
 */
describe('DatingUtil', () => {

    it('translate back to original state', () => {

        const dat: Dating = {

            type: 'single',
            begin: {
                inputYear: 2000,
                inputType: 'bce',
                year: undefined
            }
        };

        Dating.addNormalizedValues(dat);
        expect(dat.begin.year).not.toBeUndefined();
        const reverted = Dating.revert(dat);
        expect(reverted.begin.year).toBeUndefined();
    });


    it('range translate back to original state', () => {

        const dat: Dating = {

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
            }
        };

        Dating.addNormalizedValues(dat);
        expect(dat.begin.year).not.toBeUndefined();
        expect(dat.end.year).not.toBeUndefined();
        const reverted = Dating.revert(dat);
        expect(reverted.begin.year).toBeUndefined();
        expect(reverted.end.year).toBeUndefined();
    });


    it('remove empty field', () => {

        const dat: Dating = {

            type: 'single',
            begin: {
                inputYear: 2000,
                inputType: 'bce',
                year: -2001
            }
        };
        delete dat.begin.inputYear;
        delete dat.begin.inputType;

        const reverted = Dating.revert(dat);
        expect(reverted.begin).toBeUndefined();
    });
});
