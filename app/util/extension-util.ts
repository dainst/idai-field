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

        const uniqueUnsupportedExts = ExtensionUtil.getUnsupportedExts(files, supportedFileTypes).reduce(function(c, p) {
            if (c.indexOf(p as never) < 0) c.push(p as never);
            return c;
        }, []);

        let result: Array<any> = [(files.length - ExtensionUtil.getUnsupportedExts(files, supportedFileTypes).length)];
        if (uniqueUnsupportedExts.length > 0) {
            result.push(uniqueUnsupportedExts.join(','));
        }
        return result;
    }


    public static ofUnsupportedExtension(file: File, supportedFileTypes: Array<string>) {

        let ext = file.name.split('.').pop();
        if (!ext) return undefined;
        if (supportedFileTypes.indexOf(ext.toLowerCase()) == -1) return ext;
    }


    private static getUnsupportedExts(files: Array<File>, supportedFileTypes: Array<string>) {

        let unsupportedExts: Array<string> = [];
        for (let file of files) {
            let ext;
            if ((ext = ExtensionUtil.ofUnsupportedExtension(file, supportedFileTypes)) != undefined) unsupportedExts.push('"*.' + ext + '"');
        }
        return unsupportedExts;
    }
}