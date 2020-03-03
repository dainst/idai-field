/**
 * @author Thomas Kleinke
 */
export module ImageWidthCalculator {

    export function computeWidth(imageWidth: number, imageHeight: number, targetHeight: number,
                                 maxWidth: number): number {

        const targetWidth: number = Math.round(Math.min((targetHeight / imageHeight), 1) * imageWidth);

        return Math.min(targetWidth, maxWidth);
    }


    // TODO Remove if not needed; otherwise rename module
    export function computeHeight(imageWidth: number, imageHeight: number, targetWidth: number,
                                  maxHeight: number): number {

        const targetHeight: number = Math.round(Math.min((targetWidth / imageWidth), 1) * imageHeight);

        return Math.min(targetHeight, maxHeight);
    }
}