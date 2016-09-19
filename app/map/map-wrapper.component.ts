import {Component,OnInit} from '@angular/core';
import {OverviewComponent} from "../overview/overview.component";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class MapWrapperComponent implements OnInit {

    private docs;

    constructor(private overviewComponent: OverviewComponent) {}

    ngOnInit(): void {

        this.overviewComponent.getDocuments().subscribe((result) => {
           this.docs = result;
        });
    }
}
