import { JavaVersionParser } from '../../../../src/app/services/java/java-version-parser';


/**
 * @author Thomas Kleinke
 */
describe('JavaVersionParser', () => {

    test('parse Java version', () => {

        expect(JavaVersionParser.parse('java version "1.8.0_152"')).toBe(8);
        expect(JavaVersionParser.parse('java version "9"')).toBe(9);
        expect(JavaVersionParser.parse('java version "10.0.1" 2018-04-17')).toBe(10);
        expect(JavaVersionParser.parse('Java version 18.0.1.1')).toBe(18);
        expect(JavaVersionParser.parse('openjdk 19.0.2 2023-01-17')).toBe(19);
        expect(JavaVersionParser.parse('invalid string')).toBe(0);
    });
});
