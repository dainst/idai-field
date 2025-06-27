import { AfterViewChecked, Component, ViewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Document } from 'idai-field-core';
import { Loading } from '../widgets/loading';
import { PlusButtonStatus } from './plus-button.component';
import { NavigationPath } from '../../components/resources/view/state/navigation-path';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { scrollTo } from '../../angular/scrolling';
import { NavigationPathSegment } from './view/state/navigation-path-segment';
import { AngularUtility } from '../../angular/angular-utility';


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

    private scrollTarget: Document;
    private scrollToBottomElement: boolean = false;
    private scrollOnlyIfInvisible: boolean = false;
    private lastSelectedSegment: NavigationPathSegment;


    constructor(public viewFacade: ViewFacade,
                protected loading: Loading,
                protected menuService: Menus) {

        this.navigationPath = this.viewFacade.getNavigationPath();

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            if (this.navigationPath) this.lastSelectedSegment = NavigationPath.getSelectedSegment(this.navigationPath);
            this.navigationPath = path;
        });

        this.viewFacade.populateDocumentsNotifications().subscribe(async () => {
            await AngularUtility.refresh();
            this.scrollTarget = undefined;
        });
    }


    ngAfterViewChecked() {
        
        if (this.scrollTarget && this.scrollViewport) {
            this.performScrolling();
        }
    }


    public getCurrentFilterCategory(): string {

        const filterCategories = this.viewFacade.getFilterCategories();
        return filterCategories && filterCategories.length > 0 ? filterCategories[0] : undefined;
    }


    public getSelectedSegmentDoc(): Document {

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


    protected scrollToLastSelectedSegmentResource() {

        if (this.lastSelectedSegment) this.scrollTo(this.lastSelectedSegment.document, false, false, true);
    }


    protected scrollTo(scrollTarget: Document, scrollToBottomElement: boolean = false,
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
