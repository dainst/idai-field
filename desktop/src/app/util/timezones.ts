export function getSystemTimezone() {

    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}


export function getTimezones() {

    return Intl.supportedValuesOf('timeZone');
}
