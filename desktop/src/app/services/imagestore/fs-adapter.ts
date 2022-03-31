import { Injectable } from '@angular/core';
import { FilesystemAdapterInterface } from 'idai-field-core';

const fs = typeof window !== 'undefined' ? window.require('fs').promises : require('fs').promises;


/**
 * Filesystem adapter implementation that uses node's `fs` see:
 * https://nodejs.org/docs/latest/api/fs.html
 * @author Daniel de Oliveira
 * @author Simon Hohl
 * @author Thomas Kleinke
 */
@Injectable()
export class FsAdapter implements FilesystemAdapterInterface {

    public async exists(path: string): Promise<boolean> {

        return (this.isDirectory(path) || this.isFile(path));
    }


    public async writeFile(path: string, contents: any): Promise<void> {

        try {
            return await fs.writeFile(path, contents);
        } catch (err) {
            console.error('Error while trying to write file: ' + path, err);
            throw err;
        }
    }


    public async readFile(path: string): Promise<Buffer> {

        try {
            return await fs.readFile(path);
        } catch (err) {
            console.error('Error while trying to read file: ' + path, err);
            throw err;
        }
    }


    public async remove(path: string, recursive: boolean = false): Promise<void> {

        if (!await this.exists(path)) return;

        try {
            return await fs.rm(path, { recursive });
        } catch (err) {
            console.error('Error while trying to remove file: ' + path, err);
            throw err;
        }
    }


    public async mkdir(path: string, recursive: boolean = false): Promise<void> {

        try {
            return await fs.mkdir(path, { recursive });
        } catch (err) {
            console.error('Error while trying to create directory: ' + path, err);
            throw err;
        }
    }


    public async isFile(path: string): Promise<boolean> {

        try {
            const stat = await fs.statSync(path);
            return stat.isFile();
        } catch (e) {
            return false;
        }
    }


    public async isDirectory(path: string): Promise<boolean> {

        try {
            const stat = await fs.stat(path);
            return stat.isDirectory();
        } catch (e) {
            return false;
        }
    }


    public async listFiles(folderPath: string, recursive: boolean = false): Promise<string[]> {

        // see https://stackoverflow.com/a/16684530
        let results = [];
        if (!await this.isDirectory(folderPath)) return results;

        const list: string[] = (await fs.readdir(folderPath)).filter(name => !name.includes('DS_Store'));

        for (const file of list) {
            const currentFile = folderPath + file;
            const stat = await fs.stat(currentFile);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory, otherwise do not add directory to results. */
                if (recursive) results = results.concat(await this.listFiles(currentFile, recursive));
            } else {
                /* Is a file */
                results.push(currentFile);
            }
        }
        
        return results;
    }
}
