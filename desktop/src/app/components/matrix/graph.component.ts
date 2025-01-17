import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, Renderer2,
    ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as svgPanZoom from 'svg-pan-zoom';
import { Subscription } from 'rxjs';
import { GraphManipulation } from './graph-manipulation';
import { SelectionRectangle } from './selection-rectangle';
import { MatrixSelection, MatrixSelectionChange } from './matrix-selection';


@Component({
    selector: 'graph',
    templateUrl: './graph.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class GraphComponent implements OnChanges, OnDestroy {

    @Input() graph: string|undefined;
    @Input() selection: MatrixSelection;

    @Output() onSelectForEdit: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('graphContainer', {static: false}) graphContainer: ElementRef;

    private svgRoot: SVGSVGElement|undefined;
    private hoverElement: Element|undefined;

    private panZoomBehavior: SvgPanZoom.Instance;
    private selectionRectangle: SelectionRectangle|undefined;
    private lastMousePosition: { x: number, y: number }|undefined;

    private removeMouseUpEventListener: Function;
    private selectionSubscription: Subscription;

    private maxZoom: number;

    private static minZoom: number = 1;
    private static maxRealZoom: number = 2;


    constructor(@Inject(DOCUMENT) private htmlDocument: Document,
                private renderer: Renderer2) {}


    public zoomIn = () => this.panZoomBehavior.zoomIn();
    public zoomOut = () => this.panZoomBehavior.zoomOut();

    public documentsSelected = () => this.selection.documentsSelected();


    ngOnChanges() {

        this.reset();
        this.showGraph();
    }


    ngOnDestroy() {

        this.reset();
    }


    public zoomInEnabled(): boolean {

        return this.svgRoot !== undefined
            && this.panZoomBehavior.getZoom() + 0.1 <= this.maxZoom;
    }


    public zoomOutEnabled(): boolean {

        return this.svgRoot !== undefined
            && this.panZoomBehavior.getZoom() - 0.1 >= GraphComponent.minZoom;
    }


    private reset() {

        if (!this.svgRoot) return;

        this.selectionSubscription.unsubscribe();
        this.panZoomBehavior.destroy();
        this.graphContainer.nativeElement.removeChild(this.svgRoot);
        this.svgRoot = undefined;
    }


    private showGraph() {

        if (!this.graph) return;

        this.svgRoot = new DOMParser().parseFromString(this.graph, 'image/svg+xml')
            .getElementsByTagName('svg')[0];

        GraphManipulation.removeTitleElements(this.svgRoot);
        this.graphContainer.nativeElement.appendChild(this.svgRoot);
        GraphManipulation.addClusterSubgraphLabelBoxes(this.svgRoot, this.htmlDocument);
        this.configurePanZoomBehavior(this.svgRoot);
        this.subscribeSelectionChangesNotifications();
    }


    private subscribeSelectionChangesNotifications() {

        this.selectionSubscription = this.selection.changesNotifications().subscribe(
            (change: MatrixSelectionChange) => {
                GraphComponent.updateSelected(change, this.svgRoot as SVGSVGElement);
            });
    }


    private configurePanZoomBehavior(svg: SVGSVGElement) {

        this.panZoomBehavior = svgPanZoom(svg, {
            dblClickZoomEnabled: false,
            customEventsHandler: {
                haltEventListeners: ['mousedown', 'mousemove', 'mouseleave', 'mouseup'],
                init: options => this.addMouseEventListeners(options.svgElement),
                destroy: (options: any) => this.removeMouseEventListeners(options.svgElement)
            }
        });

        this.configureZooming();
    }


    private configureZooming() {

        this.maxZoom = GraphComponent.maxRealZoom / this.panZoomBehavior.getSizes().realZoom;

        if (this.panZoomBehavior.getSizes().realZoom > GraphComponent.maxRealZoom) {
            this.panZoomBehavior.zoom(this.maxZoom);
            this.panZoomBehavior.disableZoom();
        } else {
            this.panZoomBehavior.setMinZoom(GraphComponent.minZoom);
            this.panZoomBehavior.setMaxZoom(this.maxZoom);
        }
    }


    private addMouseEventListeners(svg: SVGSVGElement) {

        svg.addEventListener('mousedown', this.onMouseDown.bind(this));
        svg.addEventListener('mousemove', this.onMouseMove.bind(this));
        svg.addEventListener('click', this.onClick.bind(this));

        this.removeMouseUpEventListener
            = this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this));
    }


    private removeMouseEventListeners(svg: SVGSVGElement) {

        svg.removeEventListener('mousedown', this.onMouseDown.bind(this));
        svg.removeEventListener('mousemove', this.onMouseMove.bind(this));
        svg.removeEventListener('click', this.onClick.bind(this));

        this.removeMouseUpEventListener();
    }


    private onMouseDown(event: MouseEvent) {

        if (event.button === 2) this.lastMousePosition = { x: event.x, y: event.y };
        if (event.button === 0 && this.selection.getMode() === 'rect') {
            this.selectionRectangle = new SelectionRectangle();
            this.selectionRectangle.start(event, this.svgRoot as SVGSVGElement, this.htmlDocument);
        }
    }


    private onMouseMove(event: MouseEvent) {

        this.performPanning(event);
        this.performHovering(event.target as Element);
        if (this.selectionRectangle) this.selectionRectangle.update(event);
    }


    private onMouseUp() {

        this.lastMousePosition = undefined;
        if (this.selectionRectangle) this.performGroupSelection();
    }


    private onClick(event: Event) {

        const nodeElement: Element|undefined = GraphManipulation.getParentNodeElement(event.target as Element);
        if (!nodeElement) return;

        const resourceId: string = GraphManipulation.getResourceId(nodeElement);

        switch(this.selection.getMode()) {
            case 'none':
                this.abortHovering();
                this.onSelectForEdit.emit(resourceId);
                break;
            case 'single':
                this.selection.addOrRemove(resourceId);
                break;
            case 'rect':
                this.selection.add(resourceId);
                break;
        }
    }


    private performPanning(event: MouseEvent) {

        if (!this.lastMousePosition) return;

        const newMousePosition = { x: event.x, y: event.y };
        const delta = {
            x: newMousePosition.x - this.lastMousePosition.x,
            y: newMousePosition.y - this.lastMousePosition.y
        };

        this.panZoomBehavior.panBy(delta);
        this.lastMousePosition = newMousePosition;
    }


    private performHovering(targetElement: Element) {

        const gElement: Element|undefined = GraphManipulation.getGElement(targetElement);
        if (!gElement) return;

        if (GraphManipulation.getElementType(gElement)) {
            this.hoverElement
                = GraphManipulation.setHoverElement(this.graphContainer, gElement, this.hoverElement);
        } else {
            this.abortHovering();
        }
    }


    private abortHovering() {

        if (!this.hoverElement) return;

        GraphManipulation.setHighlighting(this.graphContainer, this.hoverElement, false);
        this.hoverElement = undefined;
    }


    private performGroupSelection() {

        if (!this.selectionRectangle) return;

        this.addToSelection(this.selectionRectangle.getSelectedElements(this.svgRoot as SVGSVGElement));

        this.selectionRectangle.finish(this.svgRoot as SVGSVGElement);
        this.selectionRectangle = undefined;
    }


    private addToSelection(selectedElements: Array<Element>) {

        if (selectedElements.length === 0) return;

        selectedElements.forEach(element => {
            this.selection.add(GraphManipulation.getResourceId(element));
        });
    }


    private static updateSelected(change: MatrixSelectionChange, svgRoot: SVGSVGElement) {

        change.ids.map(id => GraphManipulation.getNodeElement(id, svgRoot))
            .forEach(nodeElement => {
                GraphManipulation.markAsSelected(nodeElement, change.changeType === 'added');
            });
    }
}
