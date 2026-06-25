import { defaultPointRadius } from './GLMap/constants';
export interface MapSettings {
    pointRadius: number;
}

export const defaultMapSettings = ():MapSettings => (
    { pointRadius: defaultPointRadius }
);

export const normalizeMapSettings = (mapSettings: unknown): MapSettings|undefined => {
    if (!isRecord(mapSettings)) return undefined;

    return {
        pointRadius: typeof mapSettings.pointRadius === 'number'
            ? mapSettings.pointRadius
            : defaultPointRadius,
    };
};

const isRecord = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
