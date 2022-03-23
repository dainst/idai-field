export function parseDate(dateString: string): Date|undefined {

    try {
        const dateComponents: string[] = dateString.split('.');

        return new Date(
            parseInt(dateComponents[2]),
            parseInt(dateComponents[1]) - 1,
            parseInt(dateComponents[0])
        );
    } catch (_) {
        return undefined;
    }
}
