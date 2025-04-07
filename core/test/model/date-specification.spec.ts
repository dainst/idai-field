import { Map } from 'tsfun';
import { DateSpecification } from '../../src/model';


const englishTranslations: Map<string> = {
    'unspecifiedDate': 'Unspecified date',
    'toDate': 'to'
};

const germanTranslations: Map<string> = {
    'unspecifiedDate': 'Unbestimmtes Datum',
    'toDate': 'bis'
};

const translateEnglish = (term: string): string => englishTranslations[term];

const translateGerman = (term: string): string => germanTranslations[term];


/**
 * @author Thomas Kleinke
 */
 describe('DateSpecification', () => {

    it('generate English label for single date without time', () => {

        const label: string = DateSpecification.generateLabel(
            { value: '01.05.2020', isRange: false },
            'UTC', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020');
    });


    it('generate English label for range date without time', () => {

        const label: string = DateSpecification.generateLabel(
            { value: '01.05.2020', endValue: '02.06.2020', isRange: true },
            'UTC', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 to\nJune 2nd, 2020');
    });


    it('generate English label for single date with time', () => {

        let label: string = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', isRange: false },
            'UTC', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 11:15 AM (UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 23:15', isRange: false },
            'UTC', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 11:15 PM (UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 23:15', isRange: false },
            'UTC', '.', 'en', translateEnglish, false
        );
        expect(label).toBe('May 1st, 2020 11:15 PM');
    });


    it('generate English label for range date with time', () => {

        let label: string = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', endValue: '02.06.2020 19:20', isRange: true },
            'UTC', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 11:15 AM to\nJune 2nd, 2020 7:20 PM\n(UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', endValue: '02.06.2020 19:20', isRange: true },
            'UTC', '.', 'en', translateEnglish, false
        );
        expect(label).toBe('May 1st, 2020 11:15 AM to\nJune 2nd, 2020 7:20 PM');
    });


    it('generate German label for single date without time', () => {

        const label: string = DateSpecification.generateLabel(
            { value: '01.05.2020', isRange: false },
            'UTC', 'Uhr', 'de', translateGerman
        );
        expect(label).toBe('1. Mai 2020');
    });


    it('generate German label for range date without time', () => {

        const label: string = DateSpecification.generateLabel(
            { value: '01.05.2020', endValue: '02.06.2020', isRange: true },
            'UTC', 'Uhr', 'de', translateGerman
        );
        expect(label).toBe('1. Mai 2020 bis\n2. Juni 2020');
    });


    it('generate German label for single date with time', () => {

        let label: string = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', isRange: false },
            'UTC', 'Uhr', 'de', translateGerman
        );
        expect(label).toBe('1. Mai 2020 11:15 Uhr (UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 23:15', isRange: false },
            'UTC', 'Uhr', 'de', translateGerman
        );
        expect(label).toBe('1. Mai 2020 23:15 Uhr (UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 23:15', isRange: false },
            'UTC', 'Uhr', 'de', translateGerman, false
        );
        expect(label).toBe('1. Mai 2020 23:15 Uhr');
    });


    it('generate German label for range date with time', () => {

        let label: string = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', endValue: '02.06.2020 19:20', isRange: true },
            'UTC', 'Uhr', 'de', translateGerman
        );
        expect(label).toBe('1. Mai 2020 11:15 Uhr bis\n2. Juni 2020 19:20 Uhr\n(UTC)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 11:15', endValue: '02.06.2020 19:20', isRange: true },
            'UTC', 'Uhr', 'de', translateGerman, false
        );
        expect(label).toBe('1. Mai 2020 11:15 Uhr bis\n2. Juni 2020 19:20 Uhr');
    });


    it('set custom timezone', () => {

        let label: string = DateSpecification.generateLabel(
            { value: '01.05.2020', isRange: false },
            'Europe/Berlin', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 08:20', isRange: false },
            'Europe/Berlin', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 10:20 AM (Europe/Berlin)');

        label = DateSpecification.generateLabel(
            { value: '01.05.2020 08:20', endValue: '02.05.2020 14:30', isRange: true },
            'Europe/Berlin', '.', 'en', translateEnglish
        );
        expect(label).toBe('May 1st, 2020 10:20 AM to\nMay 2nd, 2020 4:30 PM\n(Europe/Berlin)');
    });
});
