/**
 * @author Thomas Kleinke
 */

export const validateUnsignedInt = (value: string): boolean => {

    const regex = new RegExp(/^\d+$/);
    return regex.test(value);
};


export const validateFloat = (value: string): boolean => {

    const regex = new RegExp(/^-?\d*\.?\d+$/);
    return regex.test(value);
};


export const validateUnsignedFloat = (value: string): boolean => {

    const regex = new RegExp(/^\d*\.?\d+$/);
    return regex.test(value);
};