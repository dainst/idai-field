import { I18N } from '../../src/tools/i18n';


/**
 * @author Thomas Kleinke
 */
describe('I18N', () => {

    it('Check if an object is an i18n string', () => {

       expect (I18N.isI18NString({ de: 'test' })).toBe(true);
       expect (I18N.isI18NString({ de: 'test1', en: 'test2', unspecifiedLanguage: 'test3' })).toBe(true);

       expect (I18N.isI18NString({ field: 'test' })).toBe(false);
       expect (I18N.isI18NString({ de: 'test1', field: 'test2' })).toBe(false);
       expect (I18N.isI18NString({ de: { subfield: 'test1' } })).toBe(false);
       expect (I18N.isI18NString('test')).toBe(false);
    });
});
