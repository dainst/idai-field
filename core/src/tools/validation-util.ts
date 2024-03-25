/**
 * @author Thomas Kleinke
 */
 export function validateInt(value: string): boolean {

    const regex = new RegExp(/^-?\d+$/);
    return regex.test(value);
};


export function validateUnsignedInt(value: string): boolean {

    const regex = new RegExp(/^\d+$/);
    return regex.test(value);
};


export function validateFloat(value: string): boolean {

    // Commas as decimal separators are detected in a separate function and are therefore allowed here
    const regex = new RegExp(/^-?\d*[.,]?\d+$/);
    return regex.test(value);
};


export function validateUnsignedFloat(value: string): boolean {

    // Commas as decimal separators are detected in a separate function and are therefore allowed here
    const regex = new RegExp(/^\d*[.,]?\d+$/);
    return regex.test(value);
};


export function validateUrl(url: string): boolean {

    const urlRegex =
        /^https?:\/\/(localhost|(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    const result = url.match(urlRegex);
    return result !== null && result[0] === url;
}
