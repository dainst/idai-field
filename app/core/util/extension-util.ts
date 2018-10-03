/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ExtensionUtil {

    /**
     * @param files
     * @param supportedFileTypes
     * @returns [count] if all files to import have supported extensions,
     *   [0] if there are no files to import, after considering unsupported extensions
     *   [count,extensionsAsJoinedString] if there are files to import and also unsupported extensions
     */
    public static reportUnsupportedFileTypes(files: Array<File>, supportedFileTypes: Array<string>): Array<any> {

        const uniqueUnsupportedExts = ExtensionUtil.getUnsupportedExtensions(files, supportedFileTypes).reduce(function(c, p) {
            if (c.indexOf(p as never) < 0) c.push(p as never);
            return c;
        }, []);

        let result: Array<any> = [(files.length - ExtensionUtil.getUnsupportedExtensions(files, supportedFileTypes).length)];
        if (uniqueUnsupportedExts.length > 0) {
            result.push(uniqueUnsupportedExts.join(','));
        }
        return result;
    }


    public static isSupported(file: File, supportedFileTypes: Array<string>) {

        let extension: string|undefined = this.getExtension(file);

        return extension && this.isSupportedExtension(extension, supportedFileTypes);
    }


    private static isSupportedExtension(extension: string, supportedFileTypes: Array<string>) {

        return supportedFileTypes.includes(extension.toLowerCase());
    }


    private static getExtension(file: File): string|undefined {

        return file.name.split('.').pop();
    }


    private static getUnsupportedExtensions(files: Array<File>, supportedFileTypes: Array<string>) {

        const unsupportedExtensions: Array<string> = [];

        for (let file of files) {
            let extension: string|undefined = this.getExtension(file);
            if (!extension) {
                unsupportedExtensions.push('"*."');
            } else if (!this.isSupportedExtension(extension, supportedFileTypes)) {
                unsupportedExtensions.push('"*.' + extension + '"');
            }
        }

        return unsupportedExtensions;
    }
}