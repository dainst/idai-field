import { Injectable } from '@angular/core';
import { FileStat, FilesystemAdapterInterface } from 'idai-field-core';
import { getAsynchronousFs } from '../get-asynchronous-fs';


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


    public async readFile(path: string): Promise<Buffer> {

        return Buffer.from(await getAsynchronousFs().readFile(path));
    }


    public async remove(path: string, recursive: boolean = false): Promise<void> {

        if (!(await this.exists(path))) return;

        try {
            return await getAsynchronousFs().rm(path, { recursive });
        } catch (err) {
            // Ignore
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


    public async listFiles(folderPath: string, recursive: boolean = false): Promise<FileStat[]> {

        // see https://stackoverflow.com/a/16684530
        let results = [];
        if (!(await this.isDirectory(folderPath))) return results;

        const fullPaths = (await getAsynchronousFs().readdir(folderPath))
            .filter((name: string) => !name.includes('.') || name.includes('.deleted') || name.includes('.original'))
            .map((filename: string) => {
            return folderPath + filename;
        });

        const fileInfos = await getAsynchronousFs().getFileInfos(fullPaths);

        const zipped = fullPaths.map((path, index) => {
            return {...{path}, ...fileInfos[index]};
        });

        for (const entry of zipped) {

            if (entry.isDirectory) {
                /* Recurse into a subdirectory, otherwise do not add directory to results. */
                if (recursive) results = results.concat(await this.listFiles(entry.path, recursive));
            } else {
                /* Is a file */
                results.push({
                    path: entry.path,
                    size: entry.size
                } as FileStat);
            }
        }
        return results;
    }
}
