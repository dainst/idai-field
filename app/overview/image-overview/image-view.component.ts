import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";

@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent implements OnInit {

    private id;

    constructor(
        private route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        this.getRouteParams(function(id){
            this.id=id;
        }.bind(this));
    }

    private getRouteParams(callback) {
        this.route.params.forEach((params: Params) => {
            callback(params['id']);
        });
    }
}
