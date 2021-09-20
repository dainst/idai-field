import { Component } from '@angular/core';

@Component({
    templateUrl: './network-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class NetworkProjectComponent {

    constructor() {

    }


    public async onKeyDown(event: KeyboardEvent) {

    }
}
