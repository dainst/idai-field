import { SettingsProvider } from '../settings/settings-provider';
import { FsAdapter } from './fs-adapter';

/**
 * @author Daniel de Oliveira
 */
export class Filestore {

    constructor(private settingsProvider: SettingsProvider,
                private fsAdapter: FsAdapter) {

        // TODO create imagestore directory if it does not exist
    }


    /**
     * Writes a file to the Filestore.
     * If it already exists, does nothing.
     *
     * @param path should start with /
     */
    public writeFile(path: string, contents: any) {

        const fullPath = this.getFullPath(path);
        if (this.fsAdapter.fileExists(fullPath)) return;

        return this.fsAdapter.writeFile(this.getFullPath(path), contents);
    }


    /**
     * Reads a file from the Filestore
     * @param path must start with /
     */
    public readFile(path: string) {

        return this.fsAdapter.readFile(this.getFullPath(path));
    }


    /**
     * @param path must start with /
     */
    public fileExists(path: string): boolean {

        return this.fsAdapter.fileExists(this.getFullPath(path));
    }


    /**
     * Removes a file from the Filestore.
     * If it already exists, does nothing.
     *
     * @param path must start with /
     */
    public removeFile(path: string) {

        if (this.fileExists(path)) this.fsAdapter.removeFile(this.getFullPath(path));
    }

    /**
     * Create a directory
     * @param path the directory's path
     * @param recursive (optional) create missing parent directories, default: `false`
     */
    public mkdir(path: string, recursive: boolean = false) {

        this.fsAdapter.mkdir(this.getFullPath(path), recursive);
    }


    /**
     * @param path must start with /
     */
    public isDirectory(path: string): boolean {

        return this.fsAdapter.isDirectory(this.getFullPath(path));
    }


    /**
     * @param path must start with /
     */
    public getFullPath(path: string): string {

        Filestore.performAssert(path);

        const imagestorePath = this.settingsProvider.getSettings().imagestorePath;
        const prefix = imagestorePath.endsWith('/')
            ? imagestorePath.substring(0, imagestorePath.length - 1)
            : imagestorePath;
        return prefix + path;
    }


    /**
     * @param path must start with /
     */
    public listFiles(path: string): Array<string> {

        return this.fsAdapter.listFiles(this.getFullPath(path))
            .map(p => p.replace(this.getFullPath('/'), ''))
            .map(p => p.replace('//', '/'))
            .map(p => '/files/' + p);
    }


    private static performAssert(path: string) {

        if (!path.startsWith('/')) throw new Error('illegal argument - path should start with /');
    }
}
