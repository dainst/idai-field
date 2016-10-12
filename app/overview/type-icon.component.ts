import {Component, OnChanges, Input} from "@angular/core";
import {Md5} from 'ts-md5/dist/md5';

// no typings available
declare class Identicon {
    constructor(hash: string, size: number);
    toString(): string;
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
        console.log(this.type);
        var hash = Md5.hashStr(this.type) as string;
        var data = new Identicon(hash, this.size).toString();
        this.url = "data:image/png;base64," + data;
    }

}