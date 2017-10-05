import {ActivatedRoute, Router} from "@angular/router";
import {Location} from '@angular/common';
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class RoutingService {

    private params;
    private routeParamsObserver;

    constructor(
        private route: ActivatedRoute,

    ) {
        this.route.params.subscribe(routeParams => {
            console.log("routeParams",routeParams)
            this.params = routeParams;

            if (this.routeParamsObserver) this.routeParamsObserver.next(routeParams);

        });
    }

    public routeParams() {

        console.log("register observer")
        return Observable.create(observer => {
            this.routeParamsObserver = observer;
            if (this.params) {
                console.log("yo",this.params)
                observer.next(this.params);
            }
        });
    }


}