import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { isString } from 'tsfun';
import { parseDate } from 'idai-field-core';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class DateParserFormatter extends NgbDateParserFormatter {

    private selectedTimezone: string = 'UTC';


    public setSelectedTimezone(timezone: string) {

        this.selectedTimezone = timezone;
    }


    public parse(value: string): NgbDateStruct {

        if (!value) return {} as NgbDateStruct;

        const parsedDate: Date = toZonedTime(
            parseDate(value),
            this.selectedTimezone
        );

        const dateSegmentsCount: number = value.split('.').length;

        return {
            year: parsedDate.getFullYear(),
            month: dateSegmentsCount > 1 ? parsedDate.getMonth() + 1 : undefined,
            day: dateSegmentsCount > 2 ? parsedDate.getDate() : undefined
        };
    }


    public format(date: NgbDateStruct): string {

        if (!date) return '';

        if (isString(date)) {
            return date;
        } else {
            let stringDate = '';
            stringDate += DateParserFormatter.isNumber(date.day)
                ? DateParserFormatter.padNumber(date.day) + '.'
                : '';
            stringDate += DateParserFormatter.isNumber(date.month)
                ? DateParserFormatter.padNumber(date.month) + '.'
                : '';
            return stringDate + date.year;
        }
    }


	private static padNumber(value: number) {

	    return (this.isNumber(value)) ? `0${value}`.slice(-2) : '';
	}


	private static isNumber(value: any): boolean {

	    return !isNaN(this.toInteger(value));
	}


	private static toInteger(value: any): number {

	    return parseInt(`${value}`, 10);
	}
}