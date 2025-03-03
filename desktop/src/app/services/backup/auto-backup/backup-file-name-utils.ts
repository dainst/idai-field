export function buildBackupFileName(project: string, creationDate: Date) {

    const year: string = creationDate.getFullYear().toString();
    const month: string = getNumberString(creationDate.getMonth() + 1);
    const day: string = getNumberString(creationDate.getDate());
    const hour: string = getNumberString(creationDate.getHours());
    const minutes: string = getNumberString(creationDate.getMinutes());
    const seconds: string = getNumberString(creationDate.getSeconds());

    return project + '_'
        + year + '-' + month + '-' + day + '_'
        + hour + '-' + minutes + '-' + seconds
        + '.jsonl';
}


function getNumberString(value: number): string {

    const result: string = value.toString();
    return result.length === 1
        ? '0' + result
        : result;
}
