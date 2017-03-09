import {Component, OnChanges, Input, Injectable} from "@angular/core";
import {Md5} from 'ts-md5/dist/md5';

// no typings available
declare class Identicon {
    constructor(hash: string, size: number);
    toString(): string;
}

class TypeIconService {

    private static icons = {};

    public static generateIconUrl(type: string, size:number) {
        if (!this.icons[type+size]) {
            var hash = Md5.hashStr(type) as string;
            var data = new Identicon(hash, size).toString();
            this.icons[type+size] = "data:image/png;base64," + data;
        }
        return this.icons[type+size];
    }

}

@Component({
    selector: 'type-icon',
    template: '<img [attr.height]="size" [attr.width]="size" [attr.src]="url">'
})

/**
 * @author Sebastian Cuy
 */

export class TypeIconComponent implements OnChanges {

    @Input() size: number;
    @Input() type: string;

    private url: string;

    ngOnChanges() {
        this.url = TypeIconService.generateIconUrl(this.type, this.size);
    }

}