import {Injectable} from '@angular/core';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class UploadStatus {

    private totalFiles: number;
    private handledFiles: number;


    public getTotalFiles(): number {

        return this.totalFiles;
    }


    public setTotalFiles(totalImages: number) {

        this.totalFiles = totalImages;
    }


    public getHandledFiles(): number {

        return this.handledFiles;
    }


    public setHandledFiles(handledImages: number) {

        this.handledFiles = handledImages;
    }
}