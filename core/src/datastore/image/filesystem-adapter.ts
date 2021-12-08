export interface FilesystemAdapterInterface {

    /**
     * Writes a file to the filesystem. Does nothing if file already exists.     *
     * @param path
     */
    writeFile(path: string, contents: any): void;


    /**
     * Reads a file from the filesystem
     * @param path
     */
    readFile(path: string): Buffer;


    /**
     * Returns if true if a directory or file exists for the for the given path
     * @param path
     */
    exists(path: string): boolean;

    /**
     * Removes a file from the filesystem. Does nothing if file not found.
     *
     * @param path
     */
    removeFile(path: string): void;

    /**
     * Create a directory
     * @param path the new directory's path
     * @param recursive (optional) create missing parent directories, default: `false`
     */
    mkdir(path: string, recursive?: boolean): void;

    /**
     * Returns `true` if the given path represents a file.
     * @param path
     */
    isFile(path: string): boolean;

    /**
     * Returns `true` if the given path represents a directory.
     * @param path
     */
    isDirectory(path: string): boolean;


    /**
     * @param path must start with /
     */
    getAbsolutePath(path: string): string;


    /**
     * Returns a list of paths of all files contained in the given path.
     * @param path
     */
    listFiles(path: string): string[];
}