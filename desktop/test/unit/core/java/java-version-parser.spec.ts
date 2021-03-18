import {JavaVersionParser} from '../../../../src/app/core/java/java-version-parser';


/**
 * @author Thomas Kleinke
 */
describe('JavaVersionParser', () => {

    it('parse Java version', () => {

        expect(JavaVersionParser.parse('java version "1.8.0_152"')).toBe(8);
        expect(JavaVersionParser.parse('java version "9"')).toBe(9);
        expect(JavaVersionParser.parse('java version "10.0.1" 2018-04-17')).toBe(10);
        expect(JavaVersionParser.parse('invalid string')).toBe(0);
    });
});
