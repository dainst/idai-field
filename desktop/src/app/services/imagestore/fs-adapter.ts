const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

/**
 * @author Daniel de Oliveira
 */
export namespace FsAdapter {

    export function fileExists(path: string) {

        return fs.existsSync(path);
    }


    export function writeFile(path: string, contents: any) {

        fs.writeFileSync(path, contents);
    }


    export function readFile(path: string) {

        return fs.readFileSync(path);
    }
}
