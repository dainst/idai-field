const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


import { Injectable } from '@angular/core';
import { FilesystemAdapterInterface } from 'idai-field-core/src/datastore/image/filesystem-adapter';
import { SettingsProvider } from '../settings/settings-provider';

@Injectable()
/**
 * @author Daniel de Oliveira
 */

export class FsAdapter implements FilesystemAdapterInterface {

    constructor(private settingsProvider: SettingsProvider) { }

    public exists(path: string): boolean {

        return (this.isDirectory(path) || this.isFile(path));
    }


    public writeFile(path: string, contents: any) {

        fs.writeFileSync(this.getAbsolutePath(path), contents);
    }


    public readFile(path: string): Buffer {

        return fs.readFileSync(this.getAbsolutePath(path));
    }


    public removeFile(path: string) {

        fs.unlinkSync(this.getAbsolutePath(path));
    }


    public mkdir(path: string, recursive: boolean) {
        fs.mkdirSync(this.getAbsolutePath(path), { recursive });
    }

    public isFile(path: string): boolean {

        return fs.lstatSync(this.getAbsolutePath(path)).isFile();
    }


    public isDirectory(path: string): boolean{

        return fs.lstatSync(this.getAbsolutePath(path)).isDirectory();
    }


    // see https://stackoverflow.com/a/16684530
    public listFiles(dir: string): string[] {

        let results = [];
        const list: string[] = fs.readdirSync(this.getAbsolutePath(dir));
        list.forEach(file => {
            file = dir + '/' + file;
            const stat = fs.statSync(file);
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


    /**
     * @param path must start with /
     */
     public getAbsolutePath(path: string): string {
        return this.settingsProvider.getSettings().imagestorePath + path;
    }


    private performAssert(path: string) {

        if (!path.startsWith('/')) throw new Error('illegal argument - path should start with /');
    }
}
