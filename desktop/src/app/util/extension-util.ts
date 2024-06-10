const path = typeof window !== 'undefined' ? window.require('path') : require('path');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export module ExtensionUtil {

    /**
     * @param files
     * @param supportedFileTypes
     * @returns [count] if all files to import have supported extensions,
     *   [0] if there are no files to import, after considering unsupported extensions
     *   [count,extensionsAsJoinedString] if there are files to import and also unsupported extensions
     */
    export function reportUnsupportedFileTypes(filePaths: string[], supportedFileTypes: string[]): any[] {

        const uniqueUnsupportedExts = getUnsupportedExts(filePaths, supportedFileTypes)
            .reduce(function(c, p) {
                if (c.indexOf(p as never) < 0) c.push(p as never);
                return c;
            }, []);

        let result: Array<any>
            = [(filePaths.length - getUnsupportedExts(filePaths, supportedFileTypes).length)];
        if (uniqueUnsupportedExts.length > 0) {
            result.push(uniqueUnsupportedExts.join(', '));
        }
        return result;
    }


    export function ofUnsupportedExtension(fileName: string, supportedFileTypes: string[]) {

        let ext = fileName.split('.').pop();
        if (!ext) return undefined;
        if (supportedFileTypes.indexOf(ext.toLowerCase()) == -1) return ext;
    }


    export const replaceExtension = (fileName: string, extension: string): string =>
        (fileName.indexOf('.') === -1)
            ? fileName + '.' + extension.toLowerCase()
            : fileName.substr(0, fileName.lastIndexOf('.')) + '.' + extension.toLowerCase();


    export const getExtension = (fileName: string): string =>
        (/(?:\.([^.]+))?$/.exec(fileName)?.[1] ?? '').toLowerCase();


    export function getUnsupportedExts(filePaths: string[], supportedFileTypes: string[]) {

        let unsupportedExts: Array<string> = [];
        for (let filePath of filePaths) {
            let ext;
            if ((ext = ofUnsupportedExtension(path.basename(filePath), supportedFileTypes)) != undefined) {
                unsupportedExts.push('"*.' + ext + '"');
            }
        }
        return unsupportedExts;
    }
}
