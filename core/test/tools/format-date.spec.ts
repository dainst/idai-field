import { formatDate } from '../../src/tools/format-date';


/**
 * @author Thomas Kleinke
 */
describe('formatDate', () => {

    it('format date without time', () => {

        expect(formatDate(new Date(2010, 5, 2), undefined, 'Europe/Berlin', 'none'))
            .toEqual('02.06.2010');
        expect(formatDate(new Date(1998, 9, 20), undefined, 'Europe/Berlin', 'none'))
            .toEqual('20.10.1998');
    });


    it('format date with time', () => {

        expect(formatDate(new Date(2010, 5, 2, 15, 30, 11), undefined, 'Europe/Berlin', 'short'))
            .toEqual('02.06.2010 15:30');
        expect(formatDate(new Date(2010, 5, 2, 15, 30, 11), undefined, 'Europe/Berlin', 'long'))
            .toEqual('02.06.2010 15:30:11');
    });


    it('format date with time considering daylight savings', () => {

        expect(formatDate(new Date(2010, 5, 2, 12, 30), undefined, undefined, 'short'))
            .toEqual('02.06.2010 10:30');
        expect(formatDate(new Date(2010, 5, 2, 12, 30), undefined, 'Europe/Berlin', 'short'))
            .toEqual('02.06.2010 12:30');

        expect(formatDate(new Date(2010, 2, 2, 12, 30), undefined, undefined, 'short'))
            .toEqual('02.03.2010 11:30');
        expect(formatDate(new Date(2010, 2, 2, 12, 30), undefined, 'Europe/Berlin', 'short'))
            .toEqual('02.03.2010 12:30');
    });


    it('format date according to locale', () => {

        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'de', 'Europe/Berlin', 'long'))
            .toEqual('2. März 2010 15:30:25');
        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'de', 'Europe/Berlin', 'short'))
            .toEqual('2. März 2010 15:30');
        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'de', 'Europe/Berlin', 'none'))
            .toEqual('2. März 2010');

        expect(formatDate(new Date(2010, 2, 2, 3, 30, 25), 'en', 'Europe/Berlin', 'long'))
            .toEqual('March 2nd, 2010 3:30:25 AM');
        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'en', 'Europe/Berlin', 'long'))
            .toEqual('March 2nd, 2010 3:30:25 PM');
        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'en', 'Europe/Berlin', 'short'))
            .toEqual('March 2nd, 2010 3:30 PM');
        expect(formatDate(new Date(2010, 2, 2, 15, 30, 25), 'en', 'Europe/Berlin', 'none'))
            .toEqual('March 2nd, 2010');
    });
});
