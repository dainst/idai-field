import { parseDate } from '../../src/tools/parse-date';


/**
 * @author Thomas Kleinke
 */
describe('parseDate', () => {

    it('parse dates', () => {

        expect(parseDate('04.10.2021').toLocaleDateString()).toEqual('4.10.2021');
        expect(parseDate('10.2021').toLocaleDateString()).toEqual('1.10.2021');
        expect(parseDate('2021').toLocaleDateString()).toEqual('1.1.2021');
    });


    it('parse dates as latest possible date', () => {

        expect(parseDate('10.2021', true).toLocaleDateString()).toEqual('31.10.2021');
        expect(parseDate('2021', true).toLocaleDateString()).toEqual('31.12.2021');
    });
});
