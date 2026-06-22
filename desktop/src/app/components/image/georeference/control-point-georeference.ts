import { ImageGeoreference } from 'idai-field-core';


export interface AerialControlPoint {
    image: { x: number, y: number };
    map: { x: number, y: number };
    label?: string;
}


export function createGeoreferenceFromControlPoints(controlPointsJson: string,
                                                    width: number,
                                                    height: number): ImageGeoreference|undefined {

    if (!controlPointsJson || !width || !height) return undefined;

    const controlPoints: AerialControlPoint[] = parseControlPoints(controlPointsJson);
    if (controlPoints.length < 3) return undefined;

    const transform = solveAffineTransform(controlPoints.slice(0, 3));
    if (!transform) return undefined;

    return {
        topLeftCoordinates: transformImagePoint(transform, 0, 0),
        topRightCoordinates: transformImagePoint(transform, width - 1, 0),
        bottomLeftCoordinates: transformImagePoint(transform, 0, height - 1)
    };
}


export function parseControlPoints(controlPointsJson: string): AerialControlPoint[] {

    const parsed = JSON.parse(controlPointsJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidControlPoint);
}


type AffineTransform = [number, number, number, number, number, number];


function isValidControlPoint(value: any): value is AerialControlPoint {

    return isFiniteNumber(value?.image?.x)
        && isFiniteNumber(value?.image?.y)
        && isFiniteNumber(value?.map?.x)
        && isFiniteNumber(value?.map?.y);
}


function isFiniteNumber(value: any): boolean {

    return typeof value === 'number' && isFinite(value);
}


function solveAffineTransform(controlPoints: AerialControlPoint[]): AffineTransform|undefined {

    const [p1, p2, p3] = controlPoints;
    const denominator = p1.image.x * (p2.image.y - p3.image.y)
        + p2.image.x * (p3.image.y - p1.image.y)
        + p3.image.x * (p1.image.y - p2.image.y);

    if (denominator === 0) return undefined;

    const xTransform = solveAffineAxis(p1.image, p2.image, p3.image,
        p1.map.x, p2.map.x, p3.map.x, denominator);
    const yTransform = solveAffineAxis(p1.image, p2.image, p3.image,
        p1.map.y, p2.map.y, p3.map.y, denominator);

    return [xTransform[0], xTransform[1], xTransform[2], yTransform[0], yTransform[1], yTransform[2]];
}


function solveAffineAxis(p1: { x: number, y: number },
                         p2: { x: number, y: number },
                         p3: { x: number, y: number },
                         v1: number,
                         v2: number,
                         v3: number,
                         denominator: number): [number, number, number] {

    const a = (v1 * (p2.y - p3.y) + v2 * (p3.y - p1.y) + v3 * (p1.y - p2.y)) / denominator;
    const b = (v1 * (p3.x - p2.x) + v2 * (p1.x - p3.x) + v3 * (p2.x - p1.x)) / denominator;
    const c = (
        v1 * (p2.x * p3.y - p3.x * p2.y)
        + v2 * (p3.x * p1.y - p1.x * p3.y)
        + v3 * (p1.x * p2.y - p2.x * p1.y)
    ) / denominator;

    return [a, b, c];
}


function transformImagePoint(transform: AffineTransform, x: number, y: number): [number, number] {

    const mapX = transform[0] * x + transform[1] * y + transform[2];
    const mapY = transform[3] * x + transform[4] * y + transform[5];

    return [mapY, mapX];
}
