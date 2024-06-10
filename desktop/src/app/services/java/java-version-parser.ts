/**
 * @author Thomas Kleinke
 */
export module JavaVersionParser {

    /**
     * @param javaVersionOutput: The output of "java -version"
     */
    export function parse(javaVersionOutput: string): number {

        console.log('Java version:', javaVersionOutput);

        if (new RegExp('version "?\\d+\\.\\d+\\.\\d+_\\d+"?').test(javaVersionOutput)
                || new RegExp('version "\\d+"').test(javaVersionOutput)
                || new RegExp('(version|openjdk) "?\\d+\\.\\d+\\.\\d+"?').test(javaVersionOutput)) {
            return parseVersionNumber(getVersionString(javaVersionOutput));
        } else {
            return 0;
        }
    }


    function getVersionString(stderr: string): string {

        const position: number = stderr.includes('version') ? 2 : 1;

        return stderr.split(' ')[position].replace(/"/g, '');
    }


    function parseVersionNumber(version: string): number {

        const components: string[] = version.split('.');

        const first: number = parseInt(components[0]);
        if (first > 1) {
            return first;
        } else {
            return parseInt(components[1]);
        }
    }
}