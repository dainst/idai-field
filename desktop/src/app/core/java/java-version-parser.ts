/**
 * @author Thomas Kleinke
 */
export module JavaVersionParser {

    /**
     * @param javaVersionOutput: The output of "java -version"
     */
    export function parse(javaVersionOutput: string): number {

        if (new RegExp('version "\\d+\\.\\d+\\.\\d+_\\d+"').test(javaVersionOutput)) {
            return parseInt(getVersionString(javaVersionOutput).split('.')[1]);
        } else if (new RegExp('version "\\d+"').test(javaVersionOutput)
            || new RegExp('version "\\d+\\.\\d+\\.\\d+"').test(javaVersionOutput)) {
            return parseInt(getVersionString(javaVersionOutput).split('.')[0]);
        } else {
            return 0;
        }
    }


    function getVersionString(stderr: string): string {

        return stderr.split(' ')[2].replace(/"/g, '');
    }
}