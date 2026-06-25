import * as sharpModule from 'sharp';

import { ImageManipulation } from '../services/imagestore/manipulation/image-manipulation';


export type SoilColorAssistStatus = 'candidatesAvailable'|'lowConfidence'|'notRun';
export type SoilColorConfidence = 'high'|'medium'|'low';

export interface RgbSample {
    blue: number;
    green: number;
    red: number;
}

export interface SoilColorCandidate {
    confidence: SoilColorConfidence;
    deltaE: number;
    munsell: string;
    rgb: RgbSample;
}

export interface SoilColorAssistUpdates {
    soilColorAssistCandidates?: string;
    soilColorAssistStatus?: SoilColorAssistStatus;
}

interface LabColor {
    a: number;
    b: number;
    l: number;
}

interface MunsellReference {
    munsell: string;
    rgb: RgbSample;
}


const TARGET_CATEGORY = 'SoilProfilePhoto';
const SAMPLE_SIZE = 96;
const LOW_CONFIDENCE_DELTA_E = 22;
const CANDIDATE_COUNT = 3;

const MUNSELL_REFERENCES: ReadonlyArray<MunsellReference> = [
    { munsell: '10YR 2/1', rgb: { red: 43, green: 39, blue: 35 } },
    { munsell: '10YR 3/1', rgb: { red: 64, green: 59, blue: 52 } },
    { munsell: '10YR 3/2', rgb: { red: 79, green: 65, blue: 50 } },
    { munsell: '10YR 4/2', rgb: { red: 101, green: 88, blue: 70 } },
    { munsell: '10YR 4/3', rgb: { red: 111, green: 87, blue: 61 } },
    { munsell: '10YR 5/3', rgb: { red: 137, green: 116, blue: 88 } },
    { munsell: '10YR 5/4', rgb: { red: 148, green: 113, blue: 74 } },
    { munsell: '10YR 6/3', rgb: { red: 166, green: 147, blue: 113 } },
    { munsell: '10YR 6/4', rgb: { red: 178, green: 147, blue: 99 } },
    { munsell: '7.5YR 3/2', rgb: { red: 78, green: 55, blue: 43 } },
    { munsell: '7.5YR 4/3', rgb: { red: 112, green: 80, blue: 58 } },
    { munsell: '7.5YR 4/4', rgb: { red: 126, green: 77, blue: 47 } },
    { munsell: '7.5YR 5/4', rgb: { red: 150, green: 105, blue: 70 } },
    { munsell: '7.5YR 5/6', rgb: { red: 164, green: 94, blue: 51 } },
    { munsell: '5YR 3/2', rgb: { red: 79, green: 49, blue: 43 } },
    { munsell: '5YR 4/3', rgb: { red: 112, green: 70, blue: 58 } },
    { munsell: '5YR 4/4', rgb: { red: 128, green: 65, blue: 51 } },
    { munsell: '5YR 5/4', rgb: { red: 153, green: 96, blue: 72 } },
    { munsell: '2.5Y 4/2', rgb: { red: 101, green: 96, blue: 75 } },
    { munsell: '2.5Y 5/2', rgb: { red: 128, green: 122, blue: 96 } },
    { munsell: '2.5Y 5/3', rgb: { red: 139, green: 128, blue: 88 } },
    { munsell: '2.5Y 6/3', rgb: { red: 166, green: 153, blue: 107 } },
    { munsell: '5Y 4/1', rgb: { red: 88, green: 88, blue: 79 } },
    { munsell: '5Y 5/2', rgb: { red: 124, green: 124, blue: 98 } },
    { munsell: 'GLEY 1 4/N', rgb: { red: 84, green: 88, blue: 86 } },
    { munsell: 'GLEY 1 5/N', rgb: { red: 112, green: 116, blue: 114 } }
];


export async function createSoilColorAssistUpdatesForImageUpload(
        categoryName: string, buffer: Buffer): Promise<SoilColorAssistUpdates> {

    if (categoryName !== TARGET_CATEGORY) return {};

    try {
        const averageRgb: RgbSample = await getCentralAverageRgb(buffer);
        const candidates: SoilColorCandidate[] = getNearestMunsellCandidates(averageRgb);

        return {
            soilColorAssistCandidates: formatCandidates(averageRgb, candidates),
            soilColorAssistStatus: candidates[0]?.deltaE > LOW_CONFIDENCE_DELTA_E
                ? 'lowConfidence'
                : 'candidatesAvailable'
        };
    } catch (_err) {
        return {
            soilColorAssistCandidates: '사진 색상 샘플을 읽지 못했습니다. 먼셀값을 직접 확인하세요.',
            soilColorAssistStatus: 'lowConfidence'
        };
    }
}


export function getNearestMunsellCandidates(rgb: RgbSample): SoilColorCandidate[] {

    const sampleLab: LabColor = rgbToLab(rgb);

    return MUNSELL_REFERENCES
        .map(reference => {
            const difference: number = deltaE(sampleLab, rgbToLab(reference.rgb));

            return {
                confidence: getConfidence(difference),
                deltaE: difference,
                munsell: reference.munsell,
                rgb: reference.rgb
            };
        })
        .sort((left, right) => left.deltaE - right.deltaE)
        .slice(0, CANDIDATE_COUNT);
}


async function getCentralAverageRgb(buffer: Buffer): Promise<RgbSample> {

    const { data, info } = await getSharp()(buffer, {
        failOn: 'none',
        limitInputPixels: ImageManipulation.MAX_INPUT_PIXELS
    })
        .autoOrient()
        .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'inside' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const xStart: number = Math.floor(info.width * 0.35);
    const xEnd: number = Math.ceil(info.width * 0.65);
    const yStart: number = Math.floor(info.height * 0.35);
    const yEnd: number = Math.ceil(info.height * 0.65);
    let red: number = 0;
    let green: number = 0;
    let blue: number = 0;
    let count: number = 0;

    for (let y: number = yStart; y < yEnd; y++) {
        for (let x: number = xStart; x < xEnd; x++) {
            const offset: number = ((y * info.width) + x) * info.channels;
            red += data[offset] ?? 0;
            green += data[offset + 1] ?? 0;
            blue += data[offset + 2] ?? 0;
            count++;
        }
    }

    return {
        blue: Math.round(blue / count),
        green: Math.round(green / count),
        red: Math.round(red / count)
    };
}


function getSharp(): any {

    const candidate: any = sharpModule as any;

    return typeof candidate === 'function'
        ? candidate
        : candidate.default;
}


function formatCandidates(averageRgb: RgbSample, candidates: SoilColorCandidate[]): string {

    return [
        `사진 중앙부 평균 RGB ${averageRgb.red}/${averageRgb.green}/${averageRgb.blue}`,
        ...candidates.map((candidate, index) =>
            `${index + 1}: ${candidate.munsell} (${getConfidenceLabel(candidate.confidence)}, 차이 ${candidate.deltaE.toFixed(1)})`
        )
    ].join('\n');
}


function rgbToLab(rgb: RgbSample): LabColor {

    const red: number = srgbToLinear(rgb.red / 255);
    const green: number = srgbToLinear(rgb.green / 255);
    const blue: number = srgbToLinear(rgb.blue / 255);
    const x: number = ((red * 0.4124) + (green * 0.3576) + (blue * 0.1805)) / 0.95047;
    const y: number = (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
    const z: number = ((red * 0.0193) + (green * 0.1192) + (blue * 0.9505)) / 1.08883;
    const fx: number = labPivot(x);
    const fy: number = labPivot(y);
    const fz: number = labPivot(z);

    return {
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
        l: (116 * fy) - 16
    };
}


function srgbToLinear(value: number): number {

    return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
}


function labPivot(value: number): number {

    return value > 0.008856
        ? Math.cbrt(value)
        : (7.787 * value) + (16 / 116);
}


function deltaE(left: LabColor, right: LabColor): number {

    return Math.sqrt(
        Math.pow(left.l - right.l, 2)
        + Math.pow(left.a - right.a, 2)
        + Math.pow(left.b - right.b, 2)
    );
}


function getConfidence(difference: number): SoilColorConfidence {

    if (difference <= 10) return 'high';
    if (difference <= LOW_CONFIDENCE_DELTA_E) return 'medium';
    return 'low';
}


function getConfidenceLabel(confidence: SoilColorConfidence): string {

    if (confidence === 'high') return '높음';
    if (confidence === 'medium') return '보통';
    return '낮음';
}
