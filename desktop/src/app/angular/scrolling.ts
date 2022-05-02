import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';


export function scrollTo(index: number, elementId: string, scrollViewport: CdkVirtualScrollViewport) {

    if (!scrollViewport) return;

    setTimeout(() => {
        if (!isVisible(elementId, scrollViewport)) {
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
