import { formatDate } from '../../src/tools/format-date';


/**
 * @author Thomas Kleinke
 */
describe('formatDate', () => {

    it('format dates', () => {

        expect(formatDate(new Date(2010, 5, 2))).toEqual('02.06.2010');
        expect(formatDate(new Date(1998, 9, 20))).toEqual('20.10.1998');
    });
});
