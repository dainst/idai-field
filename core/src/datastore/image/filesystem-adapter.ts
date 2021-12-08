export interface FilesystemAdapterInterface {

    /**
     * Writes a file to the Filestore.
     * If it already exists, does nothing.
     *
     * @param path should start with /
     */
    writeFile(path: string, contents: any): void;

    /**
     * Reads a file from the Filestore
     * @param path must start with /
     */
    readFile(path: string): Buffer;


    /**
     * @param path must start with /
     */
    exists(path: string): boolean;

    /**
     * Removes a file from the Filestore.
     * If it already exists, does nothing.
     *
     * @param path must start with /
     */
    removeFile(path: string): void;

    /**
     * Create a directory
     * @param path the directory's path
     * @param recursive (optional) create missing parent directories, default: `false`
     */
    mkdir(path: string, recursive?: boolean): void;


    /**
     * @param path must start with /
     */
    isDirectory(path: string): boolean;


    /**
     * @param path must start with /
     */
    getAbsolutePath(path: string): string;


    /**
     * @param path must start with /
     */
    listFiles(path: string): string[];
}