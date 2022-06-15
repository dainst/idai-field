import { parseDate } from '../../src/tools/parse-date';


/**
 * @author Thomas Kleinke
 */
describe('parseDate', () => {

    it('parse dates', () => {

        expect(parseDate('04.10.2021')?.toLocaleDateString('de')).toEqual('4.10.2021');
        expect(parseDate('4.10.2021')?.toLocaleDateString('de')).toEqual('4.10.2021');
        expect(parseDate('10.09.2021')?.toLocaleDateString('de')).toEqual('10.9.2021');
        expect(parseDate('10.9.2021')?.toLocaleDateString('de')).toEqual('10.9.2021');
        expect(parseDate('29.02.2020')?.toLocaleDateString('de')).toEqual('29.2.2020');
        expect(parseDate('10.2021')?.toLocaleDateString('de')).toEqual('1.10.2021');
        expect(parseDate('09.2021')?.toLocaleDateString('de')).toEqual('1.9.2021');
        expect(parseDate('9.2021')?.toLocaleDateString('de')).toEqual('1.9.2021');
        expect(parseDate('2021')?.toLocaleDateString('de')).toEqual('1.1.2021');
    });


    it('parse dates as latest possible date', () => {

        expect(parseDate('10.2021', true)?.toLocaleDateString('de')).toEqual('31.10.2021');
        expect(parseDate('2021', true)?.toLocaleDateString('de')).toEqual('31.12.2021');
    });


    it('do not parse invalid dates', () => {

        expect(parseDate('32.01.2021')).toBeUndefined();
        expect(parseDate('29.02.2021')).toBeUndefined();
        expect(parseDate('01.14.2021')).toBeUndefined();
    });
});
