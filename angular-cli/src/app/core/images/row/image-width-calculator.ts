/**
 * @author Thomas Kleinke
 */
export module ImageWidthCalculator {

    export function computeWidth(imageWidth: number, imageHeight: number, targetHeight: number,
                                 maxWidth: number): number {

        const targetWidth: number = Math.round((targetHeight / imageHeight) * imageWidth);

        return Math.min(targetWidth, maxWidth);
    }
}