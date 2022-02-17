const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

import { Injectable } from '@angular/core';
import { FilesystemAdapterInterface } from 'idai-field-core';

/**
 * Filesystem adapter implementation that uses node's `fs` see:
 * https://nodejs.org/docs/latest/api/fs.html
 * @author Daniel de Oliveira
 * @author Simon Hohl
 */
@Injectable()
export class FsAdapter implements FilesystemAdapterInterface {

    public exists(path: string): boolean {

        return (this.isDirectory(path) || this.isFile(path));
    }


    public async writeFile(path: string, contents: any): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.writeFile(path, contents, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });
    }


    public async readFile(path: string): Promise<Buffer> {

        return new Promise((resolve, reject) => {
            fs.readFile(path, (err: Error, data: Buffer) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }


    public async remove(path: string, recursive: boolean = false): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.rm(path, {recursive}, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });
    }


    public async mkdir(path: string, recursive: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, {recursive}, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });
    }


    public isFile(path: string): boolean {
        try {
            const stat = fs.statSync(path);
            return stat.isFile();
        } catch (e) {
            return false;
        }
    }


    public isDirectory(path: string): boolean{
        try {
            const stat = fs.statSync(path);
            return stat.isDirectory();
        } catch (e) {
            return false;
        }
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
