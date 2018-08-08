import {Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, Renderer2, ViewChild}
    from '@angular/core';
import {DOCUMENT} from '@angular/platform-browser';
import 'viz.js';
import * as svgPanZoom from 'svg-pan-zoom';
import {GraphManipulation} from "./graph-manipulation";


@Component({
    moduleId: module.id,
    selector: 'graph',
    templateUrl: './graph.html'
})
/**
 * Responsible for the svg / css manipulation and direct interaction of the graph.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class GraphComponent implements OnInit, OnChanges {

    @Input() graph: string;
    @Input() selectionMode: boolean = true;

    @Output() onSelect: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('graphContainer') graphContainer: ElementRef;

    private hoverElement: Element|undefined;
    private selectedElements: Array<Element> = [];

    private lastMousePosition: { x: number, y: number }|undefined;

    private static maxRealZoom: number = 2;


    constructor(@Inject(DOCUMENT) private htmlDocument: Document,
                private renderer: Renderer2) {}


    ngOnInit() {

        this.initializeMouseMoveEventListener();
    }


    ngOnChanges() {

        this.reset();
        this.showGraph();
    }


    private reset() {

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


    private performSelection(event: Event) {

        const nodeElement: Element|undefined = GraphComponent.getNodeElement(event.target as Element);
        if (!nodeElement) return;

        this.onSelect.emit(GraphComponent.getResourceIdFromNodeElement(nodeElement));

        if (this.selectionMode) {
            const selected: boolean = this.selectedElements.includes(nodeElement);
            if (selected) {
                this.selectedElements.splice(this.selectedElements.indexOf(nodeElement), 1);
            } else {
                this.selectedElements.push(nodeElement);
            }
            GraphManipulation.performHighlightingSelection(event.target as Element, !selected);
        }
    }


    private static getNodeElement(element: Element|null): Element|undefined {

        while (element) {
            if (element.classList.contains('node')) return element;
            element = element.parentElement;
        }

        return undefined;
    }


    private static getResourceIdFromNodeElement(nodeElement: Element) {

        return nodeElement.id.substring(5); // Remove 'node-' to get resource id
    }


    private initializeMouseMoveEventListener() {

        this.renderer.listen(this.graphContainer.nativeElement, 'mousemove', event => {
            this.onMouseMove(event);
        });

        this.renderer.listen(this.graphContainer.nativeElement, 'click', event => {
            this.performSelection(event);
        });
    }


    private onMouseMove(event: MouseEvent) {

        const gElement: Element|undefined = GraphManipulation.getGElement(event.target as Element);
        if (!gElement) return;

        if (GraphManipulation.getElementType(gElement)) {
            this.hoverElement = GraphManipulation.setHoverElement(this.graphContainer, gElement,
                this.hoverElement);
        } else if (this.hoverElement) {
            GraphManipulation.setHighlighting(this.graphContainer, this.hoverElement, false);
            this.hoverElement = undefined;
        }
    }


    private configurePanZoomBehavior(svg: SVGSVGElement) {

        const panZoomBehavior: SvgPanZoom.Instance = svgPanZoom(svg, {
            dblClickZoomEnabled: false,
            customEventsHandler: {
                haltEventListeners: ['mousedown', 'mousemove', 'mouseleave', 'mouseup'],
                init: options => {
                    options.svgElement.addEventListener('mousedown', (event: MouseEvent) => {
                        if (event.button === 2) this.lastMousePosition = { x: event.x, y: event.y };
                    });

                    options.svgElement.addEventListener('mousemove', (event: MouseEvent) => {
                        if (this.lastMousePosition) {
                            const newMousePosition = { x: event.x, y: event.y };
                            const delta = {
                                x: newMousePosition.x - this.lastMousePosition.x,
                                y: newMousePosition.y - this.lastMousePosition.y
                            };
                            panZoomBehavior.panBy(delta);
                            this.lastMousePosition = newMousePosition;
                        }
                    });

                    options.svgElement.addEventListener('mouseup', (event: MouseEvent) => {
                        this.lastMousePosition = undefined;
                    });
                }, destroy: () => {}
            }
        });

        const maxZoom: number = GraphComponent.maxRealZoom / panZoomBehavior.getSizes().realZoom;

        if (panZoomBehavior.getSizes().realZoom > GraphComponent.maxRealZoom) {
            panZoomBehavior.zoom(maxZoom);
            panZoomBehavior.disableZoom();
        } else {
            panZoomBehavior.setMinZoom(1);
            panZoomBehavior.setMaxZoom(maxZoom);
        }
    }
}