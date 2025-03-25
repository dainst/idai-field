import { formatDate } from '../../src/tools/format-date';


/**
 * @author Thomas Kleinke
 */
describe('formatDate', () => {

    it('format date without time', () => {

        expect(formatDate(new Date(2010, 5, 2), 'Europe/Berlin', false)).toEqual('02.06.2010');
        expect(formatDate(new Date(1998, 9, 20), 'Europe/Berlin', false)).toEqual('20.10.1998');
    });


    it('format date with time', () => {

        expect(formatDate(new Date(2010, 5, 2, 12, 30))).toEqual('02.06.2010 11:30');
        expect(formatDate(new Date(2010, 5, 2, 12, 30), 'Europe/Berlin')).toEqual('02.06.2010 12:30');
    });
});
