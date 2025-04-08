import { parseDate } from '../../src/tools/parse-date';

process.env.TZ = 'Europe/Berlin';


/**
 * @author Thomas Kleinke
 */
describe('parseDate', () => {

    it('parse dates', () => {

        expect(parseDate('04.10.2021 12:00')?.toLocaleDateString('de')).toEqual('4.10.2021');
        expect(parseDate('04.03.2021 12:00')?.toLocaleDateString('de')).toEqual('4.3.2021');
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


    it('parse time', () => {
        
        expect(parseDate('01.02.2025 14:30').toLocaleTimeString('de')).toEqual('15:30:00'); // "UTC" (default)
        expect(parseDate('01.02.2025 00:00').toLocaleTimeString('de')).toEqual('01:00:00'); // "UTC" (default)
        expect(parseDate('01.02.2025 14:30', 'Europe/Berlin').toLocaleTimeString('de')).toEqual('14:30:00');
        expect(parseDate('01.02.2025 00:00', 'Europe/Berlin').toLocaleTimeString('de')).toEqual('00:00:00');
        expect(parseDate('01.02.2025 14:30', 'Africa/Cairo').toLocaleTimeString('de')).toEqual('13:30:00');
        expect(parseDate('01.02.2025 00:00', 'Africa/Cairo').toLocaleTimeString('de')).toEqual('23:00:00');
    });


    it('consider daylight savings when parsing time', () => {

        expect(parseDate('01.03.2025 12:00', 'Europe/Berlin').getUTCHours()).toBe(11);
        expect(parseDate('01.09.2025 12:00', 'Europe/Berlin').getUTCHours()).toBe(10);
    });


    it('consider timezone when parsing date', () => {

        expect(parseDate('04.03.2021 00:00', 'Europe/Berlin').toLocaleDateString('de')).toEqual('4.3.2021');
        expect(parseDate('04.03.2021 00:00', 'Africa/Cairo').toLocaleDateString('de')).toEqual('3.3.2021');
    });


    it('parse dates as latest possible date', () => {

        expect(parseDate('01.10.2021 14:50', undefined, true)?.toLocaleDateString('de')).toEqual('1.10.2021');
        expect(parseDate('01.10.2021 14:50', undefined, true)?.toLocaleTimeString('de')).toEqual('16:50:00');

        expect(parseDate('10.2021', undefined, true)?.toLocaleDateString('de')).toEqual('31.10.2021');
        expect(parseDate('10.2021', undefined, true)?.toLocaleTimeString('de')).toEqual('23:59:00');

        expect(parseDate('11.2021', undefined, true)?.toLocaleDateString('de')).toEqual('30.11.2021');
        expect(parseDate('11.2021', undefined, true)?.toLocaleTimeString('de')).toEqual('23:59:00');

        expect(parseDate('2021', undefined, true)?.toLocaleDateString('de')).toEqual('31.12.2021');
        expect(parseDate('2021', undefined, true)?.toLocaleTimeString('de')).toEqual('23:59:00');
    });


    it('do not parse invalid dates', () => {

        expect(parseDate('32.01.2021')).toBeUndefined();
        expect(parseDate('29.02.2021')).toBeUndefined();
        expect(parseDate('01.14.2021')).toBeUndefined();
        expect(parseDate('01.01.2021 12:00:00')).toBeUndefined();
        expect(parseDate('01.2021 12:00')).toBeUndefined();
        expect(parseDate('2021 12:00')).toBeUndefined();
    });
});
