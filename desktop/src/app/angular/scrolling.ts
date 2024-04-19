import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';


export function scrollTo(index: number, elementId: string, elementHeight: number,
                         scrollViewport: CdkVirtualScrollViewport, bottomElement: boolean = false) {

    if (!scrollViewport) return;

    setTimeout(() => {
        if (!isVisible(elementId, scrollViewport)) {
            if (bottomElement) {
                const viewportSize: number = scrollViewport.getViewportSize();
                const numberOfElements: number = Math.floor(viewportSize / elementHeight);
                index = index - numberOfElements + 1;
            }

            scrollViewport.scrollToIndex(index, 'auto');
        }
    }, 0);
}


function isVisible(elementId: string, scrollViewport: CdkVirtualScrollViewport): boolean {

    const element: HTMLElement|undefined = document.getElementById(elementId);
    if (!element) return false;

    const elementRect: ClientRect = element.getBoundingClientRect();
    const sidebarRect: ClientRect = scrollViewport.getElementRef().nativeElement.getBoundingClientRect();

    return elementRect.top > sidebarRect.top && elementRect.bottom <= sidebarRect.bottom;
}
