import * as fs from 'fs';

const extract = typeof window !== 'undefined' ? undefined : require('extract-zip');


// If called from Electron app: Return fs.promises instance from Electron main process via window['filesystem']
// If called from tests: Return fs.promises instance
//
// (See: https://github.com/electron/electron/issues/19554#issuecomment-683383337)
export function getAsynchronousFs() {

    return window['filesystem'] ? filesystem : fsPromisesWrapper;
}


const filesystem = {
    isFile: (path: string) => callFsFunction('isFile', path),
    getFileInfos: (paths: string[]) => callFsFunction('getFileInfos', paths),
    isDirectory: (path: string) => callFsFunction('isDirectory', path),
    writeFile: (path: string, contents: any) => callFsFunction('writeFile', path, contents),
    readFile: (path: string, encoding?: string) => callFsFunction('readFile', path, encoding),
    readdir: (path: string) => callFsFunction('readdir', path),
    mkdir: (path: string, options: any) => callFsFunction('mkdir', path, options),
    rm: (path: string, options: any) => callFsFunction('rm', path, options),
    unlink: (path: string) => callFsFunction('unlink', path),
    extractZip: (source: string, destination: string) => callFsFunction('extractZip', source, destination),
    createCatalogZip: (outputFilePath, filePath, fileName, imageDirPath, imageDirName) =>
        callFsFunction('createCatalogZip', outputFilePath, filePath, fileName, imageDirPath, imageDirName)
};


const fsPromisesWrapper = {
    isFile: (path: string) => isFile(path),
    getFileInfos: (paths: string[]) => getFileInfos(paths),
    isDirectory: (path: string) => isDirectory(path),
    writeFile: (path: string, contents: any) => fs.promises.writeFile(path, contents),
    readFile: (path: string, encoding?: BufferEncoding) => fs.promises.readFile(path, encoding),
    readdir: (path: string) => fs.promises.readdir(path),
    mkdir: (path: string, options: any) => fs.promises.mkdir(path, options),
    rm: (path: string, options: any) => fs.promises.rm(path, options),
    unlink: (path: string) => fs.promises.unlink(path),
    extractZip: (source: string, destination: string) => extractZip(source, destination),
    createCatalogZip: () => {} // Not used in tests
};


async function callFsFunction(functionName: string, ...args: any[]): Promise<any> {

    const returnValue = await window['filesystem'][functionName](...args);

    if (returnValue.error) {
        throw returnValue.error;
    } else {
        return await returnValue.result;
    }
}


async function isFile(path: string): Promise<boolean> {

    try {
        const stat = await fs.promises.stat(path);
        return stat.isFile();
    } catch (error) {
        return false;
    }
}


async function isDirectory(path: string): Promise<boolean> {

    try {
        const stat = await fs.promises.stat(path);
        return stat.isDirectory();
    } catch (error) {
        return false;
    }
}


async function getFileInfos(paths: string[]): Promise<any> {

    return await Promise.all(paths.map(async (path) => {
        const stat = await fs.promises.stat(path);
        const size = stat.size;
        const dirCheck = stat.isDirectory();
        return { ...{ size }, ...{ isDirectory: dirCheck } };
    }));
}


function extractZip(source: string, destination: string): Promise<any> {

    return extract(source, { dir: destination });
}
