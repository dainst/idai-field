import { isObject, Predicate } from 'tsfun';

export interface OptionalRange<T> {

    value: T;
    endValue?: T;
}


export module OptionalRange {

    export const VALUE = 'value';
    export const ENDVALUE = 'endValue';


    export type Translations = 'from'|'to';


    export function buildIsOptionalRange<T>(isTValid: Predicate<T>) {
    
        return function isOptionalRange(optionalRange: any): optionalRange is OptionalRange<T> {

            if (!isObject(optionalRange)) return false;
            if (!Object.keys(optionalRange).includes(VALUE)) return false;
            else if (!isTValid(optionalRange.value)) return false;
            if (Object.keys(optionalRange).includes(ENDVALUE) && !isTValid(optionalRange[ENDVALUE])) return false; 
            return true;
        }
    }


    export function isValid<T>(optionalRange: OptionalRange<T>): boolean {

        const keys = Object.keys(optionalRange);
        if (keys.length < 1 || keys.length > 2) return false;
        if (keys.length === 1 && keys[0] !== VALUE) return false;
        if (keys.length === 2 && (!keys.includes(VALUE) || !keys.includes(ENDVALUE))) return false;
        return true;
    }


    export function generateLabel<T>(optionalRange: OptionalRange<T>,
                                     getTranslation: (term: OptionalRange.Translations) => string,
                                     getLabel: (t: T) => string): string {

        if (isValid(optionalRange)) {
            return optionalRange.endValue
                ? getTranslation('from') + getLabel(optionalRange.value) + getTranslation('to')
                    + getLabel(optionalRange.endValue)
                : getLabel(optionalRange.value);
        } else {
            return JSON.stringify(optionalRange);
        }
    }
}
