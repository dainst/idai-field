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
            const stat = await getAsynchronousFs().stat(path);
            return stat.isFile();
        } catch (e) {
            return false;
        }
    }


    public async isDirectory(path: string): Promise<boolean> {

        try {
            const stat = await getAsynchronousFs().stat(path);
            return stat.isDirectory();
        } catch (e) {
            return false;
        }
    }


    public async listFiles(folderPath: string, recursive: boolean = false): Promise<string[]> {

        // see https://stackoverflow.com/a/16684530
        let results = [];
        if (!(await this.isDirectory(folderPath))) return results;

        const list: string[] = (await getAsynchronousFs().readdir(folderPath)).filter(name => !name.includes('DS_Store'));

        for (const file of list) {
            const currentFile = folderPath + file;
            const stat = await getAsynchronousFs().stat(currentFile);
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
