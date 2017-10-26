import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class UploadStatus {

    private totalImages: number;
    private handledImages: number;

    public getTotalImages(): number {

        return this.totalImages;
    }

    public setTotalImages(totalImages: number) {

        this.totalImages = totalImages;
    }

    public getHandledImages(): number {

        return this.handledImages;
    }

    public setHandledImages(handledImages: number) {

        this.handledImages = handledImages;
    }
}