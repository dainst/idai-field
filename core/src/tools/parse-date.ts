export function parseDate(dateString: string): Date|undefined {

    try {
        const dateComponents: string[] = dateString.split('.');
        if (dateComponents.filter(component => !isNumber(component)).length > 0) return undefined;

        if (dateComponents.length === 1) {
            return new Date(
                parseInt(dateComponents[0]), 0
            );
        } else if (dateComponents.length === 2) {
            return new Date(
                parseInt(dateComponents[1]),
                parseInt(dateComponents[0]) - 1
            );
        } else if (dateComponents.length === 3) {
            return new Date(
                parseInt(dateComponents[2]),
                parseInt(dateComponents[1]) - 1,
                parseInt(dateComponents[0])
            );
        }
        
    } catch (_) {
        return undefined;
    }
}


function isNumber(value: string): boolean {

    return value.match(/^[0-9]*$/) !== null;
}
