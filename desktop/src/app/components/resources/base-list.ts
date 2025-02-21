import { AfterViewChecked, Component, ViewChild } from '@angular/core';
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
import { NavigationPathSegment } from './view/state/navigation-path-segment';


@Component({
    template: '',
    standalone: false
})
/**
 * @author Philipp Gerth
 * @author Thomas Kleinke
 */
export class BaseList implements AfterViewChecked {

    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public navigationPath: NavigationPath;
    public waitingForScroll: boolean = false;
    
    public readonly itemSize: number;

    private scrollTarget: FieldDocument;
    private scrollToBottomElement: boolean = false;
    private scrollOnlyIfInvisible: boolean = false;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                protected loading: Loading,
                protected menuService: Menus) {

        this.navigationPath = this.viewFacade.getNavigationPath();
        this.viewFacade.navigationPathNotifications().subscribe(path => {
           this.navigationPath = path;
        });
    }


    ngAfterViewChecked() {
        
        if (this.scrollTarget && this.scrollViewport) {
            this.performScrolling();
        }
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


    protected scrollToNextNavigationPathSegmentResource(path: NavigationPath) {

        const segment: NavigationPathSegment = NavigationPath.getNextSegment(path);
        if (segment) this.scrollTo(segment.document, false, false, true);
    }


    protected scrollTo(scrollTarget: FieldDocument, scrollToBottomElement: boolean = false,
                       scrollOnlyIfInvisible: boolean = true, waitForScroll: boolean = false) {

        if (!scrollTarget) return;
                        
        if (waitForScroll) this.waitingForScroll = true;
        this.scrollTarget = scrollTarget;
        this.scrollToBottomElement = scrollToBottomElement;
        this.scrollOnlyIfInvisible = scrollOnlyIfInvisible;

        // Set waitingForScroll to false automatically after 200 milliseconds as a fallback for the case 
        // that the scroll target has been deleted via synchronization
        if (waitForScroll) setTimeout(() => this.waitingForScroll = false, 200);
    }


    private performScrolling() {

        const index: number = this.viewFacade.getDocuments()
            .findIndex(document => document.resource.id === this.scrollTarget.resource.id);
        if (index === -1) return;

        scrollTo(
            index,
            'resource-' + this.scrollTarget.resource.identifier,
            this.itemSize,
            this.scrollViewport,
            this.scrollToBottomElement,
            this.scrollOnlyIfInvisible
        );

        this.scrollTarget = undefined;
        this.scrollToBottomElement = false;

        setTimeout(() => this.waitingForScroll = false, 0);
    }
}
