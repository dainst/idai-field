/**
 * @author Thomas Kleinke
 */
export module ImageWidthCalculator {

    export function computeWidth(imageWidth: number, imageHeight: number, targetHeight: number,
                                 maxWidth: number): number {

        const targetWidth: number = Math.round(Math.min((targetHeight / imageHeight), 1) * imageWidth);

        return Math.min(targetWidth, maxWidth);
    }
}