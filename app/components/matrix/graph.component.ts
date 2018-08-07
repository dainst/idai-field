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

    private static maxRealZoom: number = 2;
    private static mouseDownProperties: any = null;


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
        GraphComponent.configurePanZoomBehavior(svgGraph);
    }


    private performSelection(event: Event) {

        this.onSelect.emit(GraphComponent.mouseDownProperties.target);

        if (this.selectionMode) {
            const element: Element = event.target as Element;
            const selected: boolean = this.selectedElements.includes(element);
            if (selected) {
                this.selectedElements.splice(this.selectedElements.indexOf(element), 1);
            } else {
                this.selectedElements.push(element);
            }
            GraphManipulation.performHighlightingSelection(event.target as Element, !selected);
        }
    }


    private initializeMouseMoveEventListener() {

        this.renderer.listen(this.graphContainer.nativeElement, 'mousemove', event => {
            this.onMouseMove(event);
        });

        this.renderer.listen(this.graphContainer.nativeElement, 'mouseup', event => {

            if (GraphComponent.mouseDownProperties == null) return;

            if ((Math.abs(event.clientX - GraphComponent.mouseDownProperties.x) < 2)
                && (Math.abs(event.clientY - GraphComponent.mouseDownProperties.y) < 2)) {

                this.performSelection(event);
            }
            GraphComponent.mouseDownProperties = null;
        });

        this.renderer.listen(this.graphContainer.nativeElement, 'mousedown', event => {

            GraphComponent.mouseDownProperties = null;

            if (event.path[0]
                && event.path[0].localName !== 'svg'
                && event.path[0].localName !== 'polygon') {

                if (event.path[0].localName === 'ellipse') {

                    if (event.path[0].nextElementSibling
                        && event.path[0].nextElementSibling.childNodes.length > 0) {

                        if (event.path[0].nextElementSibling.childNodes[0].data) {

                            GraphComponent.mouseDownProperties = {
                                x: event.clientX,
                                y: event.clientY,
                                target: event.path[0].nextElementSibling.childNodes[0].data
                            };
                        }
                    }
                } else if (event.path[0].localName === 'text'
                    && event.path[0].innerHTML !== '') {

                    GraphComponent.mouseDownProperties = {
                        x: event.clientX,
                        y: event.clientY,
                        target: event.path[0].innerHTML
                    };
                }
            }
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


    private static configurePanZoomBehavior(svg: SVGSVGElement) {

        const panZoomBehavior: SvgPanZoom.Instance = svgPanZoom(svg, { dblClickZoomEnabled: false });
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