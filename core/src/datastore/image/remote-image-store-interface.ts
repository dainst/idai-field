import { FileInfo, ImageVariant } from './image-store';


export interface RemoteImageStoreInterface {
    store(uuid: string, data: Buffer, project: string, type: ImageVariant): Promise<number>;
    remove(uuid: string, project: string): Promise<any>;
    getFileInfos(
        project: string, 
        types: ImageVariant[]
    ): Promise<{ [uuid: string]: FileInfo}>;
    getFileInfosUsingCredentials(
        url: string,
        password: string,
        project: string,
        types: ImageVariant[]
    ): Promise<{ [uuid: string]: FileInfo}>;
    getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer|null>;
}