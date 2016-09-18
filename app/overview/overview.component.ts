import {Component, OnInit, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {ObjectList} from "./object-list";

@Component({

    moduleId: module.id,
    templateUrl: '../../templates/overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    constructor(@Inject('app.config') private config,
        private objectList: ObjectList,
        private router: Router) {
    }

    private filterOverviewIsCollapsed = true;

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     *   undefined if a new object is to be created if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (documentToSelect)
            this.router.navigate(['resources',documentToSelect.resource.id]);
        else {
            this.router.navigate(['resources']); // to trigger onInit in DocumentEditWrapper
            this.router.navigate(['resources','new','edit']);
        }
    }

    public ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() => this.objectList.fetchAllDocuments(), 500);
        } else {
            this.objectList.fetchAllDocuments();
        }
    }

    onKey(event:any) {
        this.objectList.fetchSomeDocuments(event.target.value);
    }
}
