import { FileInfo, ImageVariant } from "./image-store";

export interface RemoteImageStoreInterface {
    store(uuid: string, data: Buffer, project: string, type?: ImageVariant): Promise<any>;
    remove(uuid: string, project: string): Promise<any>;
    getFileIds(project: string, type?: ImageVariant): Promise<{ [uuid: string]: FileInfo}>
    getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer|null>
}