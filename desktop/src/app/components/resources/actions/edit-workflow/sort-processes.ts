import { parseDate, DateSpecification, SortMode, SortUtil, ProcessDocument } from 'idai-field-core';


export function sortProcesses(processes: Array<ProcessDocument>, sortMode: SortMode) {

    processes.sort((process1: ProcessDocument, process2: ProcessDocument) => {
        switch (sortMode) {
            case SortMode.Alphanumeric:
                return compareAlphanumerically(process1, process2);
            case SortMode.AlphanumericDescending:
                return compareAlphanumerically(process1, process2) * -1;
            case SortMode.Date:
                return compareByDate(process1, process2);
            case SortMode.DateDescending:
                return compareByDate(process1, process2) * -1;
        }
    });
}


function compareAlphanumerically(process1: ProcessDocument, process2: ProcessDocument): number {

    return SortUtil.alnumCompare(
        process1.resource.identifier,
        process2.resource.identifier
    );
}


function compareByDate(process1: ProcessDocument, process2: ProcessDocument): number {

    return SortUtil.numberCompare(
        getDateTime(process1.resource.date),
        getDateTime(process2.resource.date)
    );
}


function getDateTime(date: DateSpecification): number {

    if (!date) return 0;

    const dateValue: string = date.endValue ?? date.value;
    return parseDate(dateValue).getTime();
}
