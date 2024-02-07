import { VirtualScrollStrategy, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';


const ROW_HEIGHT: number = 233;
const ELEMENT_WIDTH: number = 208;
const BUFFER: number = ROW_HEIGHT * 2;


export class GridListVirtualScrollStrategy implements VirtualScrollStrategy {

    private index = new Subject<number>();
    private viewport: CdkVirtualScrollViewport | null = null;
    private numColumns: number;
    private rowHeight = ROW_HEIGHT;
    private elementWidth = ELEMENT_WIDTH;

    scrolledIndexChange = this.index.pipe(distinctUntilChanged());


    attach(viewport: CdkVirtualScrollViewport) {

        this.viewport = viewport;
        this.updateTotalContentSize();
    }


    detach() {

        this.index.complete();
        this.viewport = null;
    }


    onContentScrolled() {

        if (this.viewport) {
            this.updateRenderedRange(this.viewport);
        }
    }


    onDataLengthChanged() {

        this.updateTotalContentSize();
    }


    onContentRendered() {}


    onRenderedOffsetChanged() {}


    scrollToIndex(index: number, behavior: ScrollBehavior) {

        if (this.viewport) {
            this.viewport.scrollToOffset(this.getOffsetForIndex(index), behavior);
        }
    }


    private updateTotalContentSize() {

        if (this.viewport) {
            this.recalculate();
            const numRows = Math.ceil(this.viewport.getDataLength() / this.numColumns);
            this.viewport.setTotalContentSize(numRows * this.rowHeight);
        }
    }


    private recalculate() {

        const viewportElement = this.viewport.elementRef.nativeElement;
        this.numColumns = Math.floor(viewportElement.offsetWidth / this.elementWidth);
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
