import { VirtualScrollStrategy, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';


const BUFFER = 233;


export class TypeGridVirtualScrollStrategy implements VirtualScrollStrategy {

    private index = new Subject<number>();
    private viewport: CdkVirtualScrollViewport | null = null;
    private numColumns = 3;
    private rowHeight = 233; // TODO: Make parameter
    private elementWidth = 208; // TODO: Make parameter

    scrolledIndexChange = this.index.pipe(distinctUntilChanged());

    attach(viewport: CdkVirtualScrollViewport): void {

        this.viewport = viewport;
        console.log('onDataLengthChanged');
        this.updateTotalContentSize();
    }


    detach(): void {

        this.index.complete();
        this.viewport = null;
    }


    onContentScrolled(): void {

        if (this.viewport) {
            this.updateRenderedRange(this.viewport);
        }
    }


    onDataLengthChanged(): void {

        this.updateTotalContentSize();
    }


    onContentRendered(): void { }


    onRenderedOffsetChanged(): void { }


    scrollToIndex(index: number, behavior: ScrollBehavior): void {

        if (this.viewport) {
            this.viewport.scrollToOffset(this.getOffsetForIndex(index), behavior);
        }
    }


    private updateTotalContentSize() {

        if (this.viewport) {
            this.calculateNumColumns();
            const numRows = Math.ceil(this.viewport.getDataLength() / this.numColumns);
            this.viewport.setTotalContentSize(numRows * this.rowHeight);
        }
    }


    private calculateNumColumns() {

        this.numColumns = Math.floor(this.viewport.elementRef.nativeElement.offsetWidth / this.elementWidth);
    }


    private getOffsetForIndex(index: number) {

        const rowIndex = Math.floor(index / this.numColumns);
        return rowIndex * this.rowHeight;
    }


    private getIndexForOffset(offset: number) {

        const rowIndex = Math.floor(offset / this.rowHeight);
        return rowIndex * this.numColumns;
    }


    private updateRenderedRange(viewport: CdkVirtualScrollViewport) {

        const viewportSize = viewport.getViewportSize();
        const offset = viewport.measureScrollOffset();
        const {start, end} = viewport.getRenderedRange();
        const dataLength = viewport.getDataLength();
        const newRange = {start, end};
        const firstVisibleIndex = this.getIndexForOffset(offset);
        const startBuffer = offset - this.getOffsetForIndex(start);

        if (startBuffer < BUFFER && start !== 0) {
            newRange.start = Math.max(0, this.getIndexForOffset(offset - BUFFER * 2));
            newRange.end = Math.min(
                dataLength,
                this.getIndexForOffset(offset + viewportSize + BUFFER),
            );
        } else {
            const endBuffer = this.getOffsetForIndex(end) - offset - viewportSize;

            if (endBuffer < BUFFER && end !== dataLength) {
                newRange.start = Math.max(0, this.getIndexForOffset(offset - BUFFER));
                newRange.end = Math.min(
                    dataLength,
                    this.getIndexForOffset(offset + viewportSize + BUFFER * 2),
                );
            }
        }

        viewport.setRenderedRange(newRange);
        viewport.setRenderedContentOffset(this.getOffsetForIndex(newRange.start));
        this.index.next(firstVisibleIndex);
     }

}
