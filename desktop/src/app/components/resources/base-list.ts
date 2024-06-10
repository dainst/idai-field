import { Component, ViewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FieldDocument } from 'idai-field-core';
import { ResourcesComponent } from './resources.component';
import { Loading } from '../widgets/loading';
import { PlusButtonStatus } from './plus-button.component';
import { NavigationPath } from '../../components/resources/view/state/navigation-path';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { scrollTo } from '../../angular/scrolling';


@Component({
   template: ''
})
/**
 * @author Philipp Gerth
 * @author Thomas Kleinke
 */
export class BaseList {

    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public navigationPath: NavigationPath;
    
    public readonly itemSize: number;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                protected loading: Loading,
                protected menuService: Menus) {

        this.navigationPath = this.viewFacade.getNavigationPath();
        this.viewFacade.navigationPathNotifications().subscribe(path => this.navigationPath = path);
    }


    public getCurrentFilterCategory()  {

        const filterCategories = this.viewFacade.getFilterCategories();
        return filterCategories && filterCategories.length > 0 ? filterCategories[0] : undefined;
    }


    public getSelectedSegmentDoc() {

        const segment = NavigationPath.getSelectedSegment(this.navigationPath);
        return segment ? segment.document : undefined;
    }


    public isPlusButtonShown(): boolean {

        return this.menuService.getContext() !== MenuContext.GEOMETRY_EDIT
            && this.viewFacade.isReady()
            && !this.loading.isLoading();
    }


    public getPlusButtonStatus(): PlusButtonStatus {

        return this.viewFacade.isInExtendedSearchMode()
            ? 'disabled-hierarchy'
            : 'enabled';
    }


    protected scrollTo(scrollTarget: FieldDocument|undefined, bottomElement: boolean = false) {

        if (!scrollTarget) return;

        const index = this.viewFacade.getDocuments()
            .findIndex(document => document.resource.id === scrollTarget.resource.id);

        if (!this.scrollViewport) {
            setTimeout(() => this.scrollTo(scrollTarget, bottomElement), 100);
        } else {
            scrollTo(
                index, 'resource-' + scrollTarget.resource.identifier, this.itemSize,
                this.scrollViewport, bottomElement
            );
        }
    }
}
