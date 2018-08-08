import {Component, ElementRef, EventEmitter, Inject, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {DOCUMENT} from '@angular/platform-browser';
import 'viz.js';
import * as svgPanZoom from 'svg-pan-zoom';
import {GraphManipulation} from './graph-manipulation';


@Component({
    moduleId: module.id,
    selector: 'graph',
    templateUrl: './graph.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class GraphComponent implements OnChanges {

    @Input() graph: string;
    @Input() selectionMode: boolean = true;

    @Output() onSelect: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('graphContainer') graphContainer: ElementRef;

    private hoverElement: Element|undefined;
    private selectedElements: Array<Element> = [];

    private panZoomBehavior: SvgPanZoom.Instance;
    private lastMousePosition: { x: number, y: number }|undefined;

    private static maxRealZoom: number = 2;


    constructor(@Inject(DOCUMENT) private htmlDocument: Document) {}


    ngOnChanges() {

        this.reset();
        this.showGraph();
    }


    private reset() {

        if (this.panZoomBehavior) this.panZoomBehavior.destroy();

        while (this.graphContainer.nativeElement.firstChild) {
            this.graphContainer.nativeElement.removeChild(this.graphContainer.nativeElement.firstChild);
        }
    }


    private showGraph() {

        if (!this.graph) return;

        const svgGraph = new DOMParser().parseFromString(this.graph, 'image/svg+xml')
            .getElementsByTagName('svg')[0];

        GraphManipulation.removeTitleElements(svgGraph);
        this.graphContainer.nativeElement.appendChild(svgGraph);
        GraphManipulation.addClusterSubgraphLabelBoxes(svgGraph, this.htmlDocument);
        this.configurePanZoomBehavior(svgGraph);
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

        const maxZoom: number = GraphComponent.maxRealZoom / this.panZoomBehavior.getSizes().realZoom;

        if (this.panZoomBehavior.getSizes().realZoom > GraphComponent.maxRealZoom) {
            this.panZoomBehavior.zoom(maxZoom);
            this.panZoomBehavior.disableZoom();
        } else {
            this.panZoomBehavior.setMinZoom(1);
            this.panZoomBehavior.setMaxZoom(maxZoom);
        }
    }


    private addMouseEventListeners(svg: SVGSVGElement) {

        svg.addEventListener('mousedown', this.onMouseDown.bind(this));
        svg.addEventListener('mousemove', this.onMouseMove.bind(this));
        svg.addEventListener('mouseup', this.onMouseUp.bind(this));
        svg.addEventListener('click', this.onClick.bind(this));
    }


    private removeMouseEventListeners(svg: SVGSVGElement) {

        svg.removeEventListener('mousedown', this.onMouseDown.bind(this));
        svg.removeEventListener('mousemove', this.onMouseMove.bind(this));
        svg.removeEventListener('mouseup', this.onMouseUp.bind(this));
        svg.removeEventListener('click', this.onClick.bind(this));
    }


    private onMouseDown(event: MouseEvent) {

        if (event.button === 2) this.lastMousePosition = { x: event.x, y: event.y };
    }


    private onMouseMove(event: MouseEvent) {

        this.performPanning(event);
        this.performHovering(event.target as Element);
    }


    private onMouseUp() {

        this.lastMousePosition = undefined;
    }


    private onClick(event: Event) {

        const nodeElement: Element|undefined = GraphManipulation.getNodeElement(event.target as Element);
        if (!nodeElement) return;

        this.onSelect.emit(GraphManipulation.getResourceId(nodeElement));

        if (this.selectionMode) this.performSelection(nodeElement);
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
        } else if (this.hoverElement) {
            GraphManipulation.setHighlighting(this.graphContainer, this.hoverElement, false);
            this.hoverElement = undefined;
        }
    }


    private performSelection(nodeElement: Element) {

        const isSelected: boolean = this.selectedElements.includes(nodeElement);

        if (isSelected) {
            this.selectedElements.splice(this.selectedElements.indexOf(nodeElement), 1);
        } else {
            this.selectedElements.push(nodeElement);
        }

        GraphManipulation.performHighlightingSelection(nodeElement, !isSelected);
    }
}