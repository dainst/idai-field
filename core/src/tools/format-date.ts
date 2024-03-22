export function formatDate(date: Date): string {

    const day: string = date.getDate().toString().padStart(2, '0');
    const month: string = (date.getMonth() + 1).toString().padStart(2, '0');
    const year: string = date.getFullYear().toString();

    return `${day}.${month}.${year}`;
}
