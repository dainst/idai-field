import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { toZonedTime } from 'date-fns-tz';
import { isString } from 'tsfun';
import { parseDate } from 'idai-field-core';
import { NumberUtil } from '../../../../../util/number-util';


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
            stringDate += NumberUtil.isNumber(date.day)
                ? NumberUtil.padNumber(date.day) + '.'
                : '';
            stringDate += NumberUtil.isNumber(date.month)
                ? NumberUtil.padNumber(date.month) + '.'
                : '';
            return stringDate + date.year;
        }
    }
}