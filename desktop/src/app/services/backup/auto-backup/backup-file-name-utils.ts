export type ParseBackupFileNameResult = {
    project: string;
    creationDate: Date;
}


export function buildBackupFileName(project: string, creationDate: Date) {

    const year: string = creationDate.getFullYear().toString();
    const month: string = getNumberString(creationDate.getMonth() + 1);
    const day: string = getNumberString(creationDate.getDate());
    const hours: string = getNumberString(creationDate.getHours());
    const minutes: string = getNumberString(creationDate.getMinutes());
    const seconds: string = getNumberString(creationDate.getSeconds());

    return project + '.'
        + year + '-' + month + '-' + day + '.'
        + hours + '-' + minutes + '-' + seconds
        + '.jsonl';
}


export function parseBackupFileName(fileName: string): ParseBackupFileNameResult|undefined {

    try {
        const segments: string[] = fileName.split('.');
        if (segments.length !== 4) return undefined;

        const project: string = segments[0];
        const date: string = segments[1];
        const time: string = segments[2];

        const dateSegments: string[] = date.split('-');
        if (dateSegments.length !== 3) return undefined;

        const year: number = parseInt(dateSegments[0]);
        const month: number = parseInt(dateSegments[1]) - 1;
        const day: number = parseInt(dateSegments[2]);

        const timeSegments: string[] = time.split('-');
        if (timeSegments.length !== 3) return undefined;

        const hours: number = parseInt(timeSegments[0]);
        const minutes: number = parseInt(timeSegments[1]);
        const seconds: number = parseInt(timeSegments[2]);

        return {
            project,
            creationDate: new Date(year, month, day, hours, minutes, seconds)
        }
    } catch (err) {
        return undefined;
    }
}


function getNumberString(value: number): string {

    const result: string = value.toString();
    return result.length === 1
        ? '0' + result
        : result;
}
