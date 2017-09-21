import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class UploadStatus {

    private totalImages: number;
    private uploadedImages: number;

    public getTotalImages(): number {

        return this.totalImages;
    }

    public setTotalImages(totalImages: number) {

        this.totalImages = totalImages;
    }

    public getUploadedImages(): number {

        return this.uploadedImages;
    }

    public setUploadedImages(uploadedImages: number) {

        this.uploadedImages = uploadedImages;
    }
}