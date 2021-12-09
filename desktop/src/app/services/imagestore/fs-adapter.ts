const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

import { Injectable } from '@angular/core';
import { FilesystemAdapterInterface } from 'idai-field-core/src/datastore/image/filesystem-adapter';
import { SettingsProvider } from '../settings/settings-provider';

/**
 * Filesystem adapter implementation that uses node's `fs` see:
 * https://nodejs.org/docs/latest/api/fs.html
 * @author Daniel de Oliveira
 * @author Simon Hohl
 */
@Injectable()
export class FsAdapter implements FilesystemAdapterInterface {

    constructor(private settingsProvider: SettingsProvider) { }

    public exists(path: string): boolean {

        return (this.isDirectory(path) || this.isFile(path));
    }


    public writeFile(path: string, contents: any) {

        fs.writeFileSync(path, contents);
    }


    public readFile(path: string): Buffer {

        return fs.readFileSync(path);
    }


    public removeFile(path: string) {

        fs.unlinkSync(path);
    }


    public mkdir(path: string, recursive: boolean) {
        fs.mkdirSync(path, { recursive });
    }


    public isFile(path: string): boolean {

        const stat = fs.statSync(path, {throwIfNoEntry: false});

        if (!stat) return false;
        return stat.isFile();
    }


    public isDirectory(path: string): boolean{

        const stat = fs.statSync(path, {throwIfNoEntry: false});

        if (!stat) return false;
        return stat.isDirectory();
    }


    public listFiles(dir: string, recursive: boolean = false): string[] {
        // see https://stackoverflow.com/a/16684530
        let results = [];
        const list: string[] = fs.readdirSync(dir);

        for (const file of list) {
            const currentFile = dir + file;
            const stat = fs.statSync(currentFile);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory, otherwise do not add directory to results. */
                if (recursive) results = results.concat(this.listFiles(currentFile, recursive));
            } else {
                /* Is a file */
                results.push(currentFile);
            }
        }
        return results;
    }
}
