export interface FileStat {
    path: string,
    size: number
}

export interface FilesystemAdapterInterface {

    /**
     * Writes a file to the filesystem. Does nothing if file already exists.     *
     * @param path
     */
    writeFile(path: string, contents: any): Promise<void>;


    /**
     * Reads a file from the filesystem
     * @param path
     */
    readFile(path: string): Promise<Buffer>;


    /**
     * Returns if true if a directory or file exists for the for the given path
     * @param path
     */
    exists(path: string): Promise<boolean>;

    /**
     * Removes a file from the filesystem. Does nothing if file not found.
     *
     * @param path
     */
    remove(path: string, recursive?: boolean): Promise<void>;

    /**
     * Create a directory
     * @param path the new directory's path
     * @param recursive (optional) create missing parent directories, default: `false`
     */
    mkdir(path: string, recursive?: boolean): Promise<void>;

    /**
     * Returns `true` if the given path represents a file.
     * @param path
     */
    isFile(path: string): Promise<boolean>;

    /**
     * Returns `true` if the given path represents a directory.
     * @param path
     */
    isDirectory(path: string): Promise<boolean>;


    /**
     * Returns a list of paths of all files contained in the given path.
     * @param path
     * @param recursive (optional) also list files in subdirectories
     */
    listFiles(path: string, recursive?: boolean): Promise<FileStat[]>;
}
