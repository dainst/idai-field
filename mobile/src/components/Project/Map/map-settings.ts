import { defaultPointRadius } from './GLMap/constants';
export interface MapSettings {
    pointRadius: number;
}

export const defaultMapSettings = ():MapSettings => (
    { pointRadius: defaultPointRadius }
);