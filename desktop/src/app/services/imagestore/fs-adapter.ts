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


    public mkdir(path: string) {

        fs.mkdirSync(path);
    }


    public isDirectory(path: string) {

        return fs.lstatSync(path).isDirectory();
    }


    // see https://stackoverflow.com/a/16684530
    public listFiles(dir) {

        var results = [];
        var list = fs.readdirSync(dir);
        list.forEach(file => {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(this.listFiles(file));
            } else {
                /* Is a file */
                results.push(file);
            }
        });
        return results;
    }
}
