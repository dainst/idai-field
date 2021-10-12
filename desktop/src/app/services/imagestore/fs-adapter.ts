const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Daniel de Oliveira
 */
export class FsAdapter {

    public fileExists(path: string) {

        return fs.existsSync(path);
    }


    public writeFile(path: string, contents: any) {

        fs.writeFileSync(path, contents);
    }


    public readFile(path: string) {

        return fs.readFileSync(path);
    }
}
