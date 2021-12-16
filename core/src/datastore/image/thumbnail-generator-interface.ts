export interface ThumbnailGeneratorInterface {

    generate(data: Buffer, thumbnailTargetHeight: number): Promise<Buffer>;
}

