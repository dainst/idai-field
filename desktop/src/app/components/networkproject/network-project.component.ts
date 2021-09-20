import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    templateUrl: './network-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class NetworkProjectComponent {

    constructor() {

    }
}
