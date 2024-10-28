export interface CSBox {
    minX: number;
    width: number;
    minY: number;
    height: number;
}

export interface GeometryBoundings {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}


export interface Transformation {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
}