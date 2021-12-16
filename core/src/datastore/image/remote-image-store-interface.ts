import { ImageVariant } from "./image-store";

export interface RemoteImageStoreInterface {
    store(uuid: string, data: Buffer, project: string, type?: ImageVariant): void;
    getFileIds(project: string, type?: ImageVariant): Promise<{ [uuid: string]: ImageVariant[]}>
    getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer|null>
}