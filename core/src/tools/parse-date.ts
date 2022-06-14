export function parseDate(dateString: string, latestPossibleDate: boolean = false): Date|undefined {

    try {
        const dateComponents: string[] = dateString.split('.');
        if (dateComponents.filter(component => !isNumber(component)).length > 0) return undefined;
        
        const date: Date|undefined = parse(dateComponents, latestPossibleDate);

        return (date && isValid(date, dateComponents)) ? date : undefined;
    } catch (_) {
        return undefined;
    }
}


function parse(dateComponents: string[], latestPossibleDate: boolean = false): Date|undefined {

    if (dateComponents.length === 1) {
        return new Date(
            parseInt(dateComponents[0]),
            latestPossibleDate ? 11 : 0,
            latestPossibleDate ? 31 : 1
        );
    } else if (dateComponents.length === 2) {
        return latestPossibleDate
            ? new Date(
                parseInt(dateComponents[1]),
                parseInt(dateComponents[0]),
                0
            ) : new Date(
                parseInt(dateComponents[1]),
                parseInt(dateComponents[0]) - 1,
                1
            );
    } else if (dateComponents.length === 3) {
        return new Date(
            parseInt(dateComponents[2]),
            parseInt(dateComponents[1]) - 1,
            parseInt(dateComponents[0])
        );
    }
}


function isValid(date: Date, dateComponents: string[]): boolean {

    const normalizedDateComponents: string[] = dateComponents.map(dateComponent => {
        if (dateComponent.startsWith('0')) {
            return dateComponent.slice(1);
        } else {
            return dateComponent;
        }
    });

    if (normalizedDateComponents.length === 2) {
        return (date.getMonth() + 1).toString() === normalizedDateComponents[0];
    } else if (normalizedDateComponents.length === 3) {
        return (date.getMonth() + 1).toString() === normalizedDateComponents[1]
            && date.getDate().toString() === normalizedDateComponents[0];
    } else {
        return true;
    }
}


function isNumber(value: string): boolean {

    return value.match(/^[0-9]*$/) !== null;
}
