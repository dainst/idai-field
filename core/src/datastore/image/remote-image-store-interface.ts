import { FileInfo, ImageVariant } from "./image-store";

export interface RemoteImageStoreInterface {
    store(uuid: string, data: Buffer, project: string, type?: ImageVariant): void;
    remove(uuid: string, project: string): void;
    getFileIds(project: string, type?: ImageVariant): Promise<{ [uuid: string]: FileInfo}>
    getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer|null>
}