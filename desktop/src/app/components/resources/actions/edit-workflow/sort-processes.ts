import { parseDate, DateSpecification, SortMode, Comparator, ProcessDocument } from 'idai-field-core';


export function sortProcesses(processes: Array<ProcessDocument>, sortMode: SortMode, comparator: Comparator) {

    processes.sort((process1: ProcessDocument, process2: ProcessDocument) => {
        switch (sortMode) {
            case SortMode.Alphanumeric:
                return compareAlphanumerically(process1, process2, comparator);
            case SortMode.AlphanumericDescending:
                return compareAlphanumerically(process1, process2, comparator) * -1;
            case SortMode.Date:
                return compareByDate(process1, process2, comparator);
            case SortMode.DateDescending:
                return compareByDate(process1, process2, comparator) * -1;
        }
    });
}


function compareAlphanumerically(process1: ProcessDocument, process2: ProcessDocument, comparator: Comparator): number {

    return comparator.alnumCompare(
        process1.resource.identifier,
        process2.resource.identifier
    );
}


function compareByDate(process1: ProcessDocument, process2: ProcessDocument, comparator: Comparator): number {

    return comparator.numberCompare(
        getDateTime(process1.resource.date),
        getDateTime(process2.resource.date)
    );
}


function getDateTime(date: DateSpecification): number {

    if (!date) return 0;

    const dateValue: string = date.endValue ?? date.value;
    return parseDate(dateValue).getTime();
}
