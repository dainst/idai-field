/**
 * @author Thomas Kleinke
 */
export interface Date {

    value: DateTimeValue;
    endValue?: DateTimeValue;
}


export interface DateTimeValue {

    date: string;
    time?: string;
}
