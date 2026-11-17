import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Settings } from '../../../../../services/settings/settings';
import { NumberUtil } from '../../../../../util/number-util';


export type TimeSpecification = {
    hours?: number;
    minutes?: number;
}


@Component({
    selector: 'time-input',
    templateUrl: './time-input.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class TimeInputComponent implements OnChanges {

    @Input() time: TimeSpecification;

    @Output() onChanged: EventEmitter<TimeSpecification> = new EventEmitter<TimeSpecification>();

    public meridian: '24h'|'am'|'pm' = '24h';
    public timeString: string;
    public focused: boolean = false;


    constructor() {}


    public getMinTime = () => this.meridian === '24h' ? '00:00' : '01:00';

    public getMaxTime = () => this.meridian === '24h' ? '23:59' : '11:59';


    ngOnChanges() {

        this.update();
    }


    public toggleMeridian() {

        this.meridian = this.meridian === 'am' ? 'pm' : 'am';
        this.notify();
    }


    public notify() {

        const timeSpecification: TimeSpecification = {
            hours: this.getHours(),
            minutes: this.getMinutes()
        };

        this.onChanged.emit(timeSpecification);
    }


    public getTimeSuffix(): string|undefined {

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        // If the time suffix is set to '.', this indicates that no time suffix should be used
        return timeSuffix !== '.' ? timeSuffix : undefined;
    }


    private update() {

        let hours: number;

        if (Settings.getLocale() === 'en') {
            if (this.time.hours >= 12) {
                hours = this.time.hours > 12 ? this.time.hours - 12 : 12;
                this.meridian = 'pm';
            } else {
                hours = this.time.hours === 0 ? 12 : this.time.hours;
                this.meridian = 'am';
            }
        } else {
            hours = this.time.hours;
        }

        const minutes: number = this.time.minutes;

        this.timeString = TimeInputComponent.getTimeString(hours, minutes);
    }


    private getHours() {

        let hours: number = parseInt(this.timeString.split(':')[0]);

        if (this.meridian === 'pm' && hours < 12) {
            hours += 12;
        } else if (this.meridian === 'am' && hours === 12) {
            hours = 0;
        } 

        return hours;
    }


    private getMinutes() {

        return parseInt(this.timeString.split(':')[1]);
    }


    private static getTimeString(hours: number, minutes: number): string {

        const result: string = NumberUtil.padNumber(hours) + ':' + NumberUtil.padNumber(minutes);

        return result.length > 1 ? result : undefined;
    }
}
