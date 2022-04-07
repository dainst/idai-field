import { Injectable } from '@angular/core';
import { FilesystemAdapterInterface } from 'idai-field-core';
import { getAsynchronousFs } from '../getAsynchronousFs';


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

        return (await this.isDirectory(path) || await this.isFile(path));
    }


    public async writeFile(path: string, contents: any): Promise<void> {

        try {
            return await getAsynchronousFs().writeFile(path, contents);
        } catch (err) {
            console.error('Error while trying to write file: ' + path, err);
            throw err;
        }
    }


    public readFile(path: string): Promise<Buffer> {

        return getAsynchronousFs().readFile(path);
    }


    public async remove(path: string, recursive: boolean = false): Promise<void> {

        if (!(await this.exists(path))) return;

        try {
            return await getAsynchronousFs().rm(path, { recursive });
        } catch (err) {
            console.error('Error while trying to remove file: ' + path, err);
            throw err;
        }
    }


    public async mkdir(path: string, recursive: boolean = false): Promise<void> {

        try {
            return await getAsynchronousFs().mkdir(path, { recursive });
        } catch (err) {
            console.error('Error while trying to create directory: ' + path, err);
            throw err;
        }
    }


    public async isFile(path: string): Promise<boolean> {

        try {
            return await getAsynchronousFs().isFile(path);
        } catch (err) {
            console.error('isFile failed: ' + path, err);
        }
    }


    public async isDirectory(path: string): Promise<boolean> {

        try {
            return await getAsynchronousFs().isDirectory(path);
        } catch (err) {
            console.error('isDirectory failed: ' + path, err);
        }
    }


    public async listFiles(folderPath: string, recursive: boolean = false): Promise<string[]> {

        // see https://stackoverflow.com/a/16684530
        let results = [];
        if (!(await this.isDirectory(folderPath))) return results;

        const list: string[] = (await getAsynchronousFs().readdir(folderPath)).filter(name => !name.includes('DS_Store'));

        for (const file of list) {
            const currentFile = folderPath + file;
            if (await this.isDirectory(currentFile)) {
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
