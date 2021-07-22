/**
 * @author Thomas Kleinke
 */
export const validateUnsignedInt = (value: string): boolean => {

    const regex = new RegExp(/^\d+$/);
    return regex.test(value);
};


export const validateFloat = (value: string): boolean => {

    // Commas as decimal separators are detected in a separate function and are therefore allowed here
    const regex = new RegExp(/^-?\d*[.,]?\d+$/);
    return regex.test(value);
};


export const validateUnsignedFloat = (value: string): boolean => {

    // Commas as decimal separators are detected in a separate function and are therefore allowed here
    const regex = new RegExp(/^\d*[.,]?\d+$/);
    return regex.test(value);
};