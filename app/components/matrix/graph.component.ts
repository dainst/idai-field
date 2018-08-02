import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
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
    @Output() onSelect: EventEmitter<string> = new EventEmitter<string>();
    @Input() highlightSelection = true;

    @ViewChild('graphContainer') graphContainer: ElementRef;

    private hoverElement: Element|undefined;

    private static maxRealZoom: number = 2;

    private static mouseDownProperties: any = null;

    constructor(private renderer: Renderer2) {}


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

        GraphComponent.removeTitleElements(svgGraph);
        this.graphContainer.nativeElement.appendChild(svgGraph);
        GraphComponent.configurePanZoomBehavior(svgGraph);
    }


    private performSelection(event: Event) {

        this.onSelect.emit(GraphComponent.mouseDownProperties.target);

        if (this.highlightSelection) GraphComponent
            .performHighlightingSelection(event.target as Element);
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
                            }
                        }
                    }
                } else if (event.path[0].localName === 'text'
                    && event.path[0].innerHTML !== '') {

                    GraphComponent.mouseDownProperties = {
                        x: event.clientX,
                        y: event.clientY,
                        target: event.path[0].innerHTML
                    }
                }
            }
        });
    }


    private onMouseMove(event: MouseEvent) {

        const gElement: Element|undefined = GraphManipulation.getGElement(event.target as Element);

        if (!gElement) return;

        if (GraphManipulation.getElementType(gElement)) {
            this.setHoverElement(gElement);
        } else if (this.hoverElement) {
            GraphManipulation.setHighlighting(this.graphContainer, this.hoverElement, false);
            this.hoverElement = undefined;
        }
    }


    private setHoverElement(element: Element) {

        if (this.hoverElement && this.hoverElement == element) return;

        if (this.hoverElement) GraphManipulation.setHighlighting(
            this.graphContainer, this.hoverElement, false);
        GraphManipulation.setHighlighting(this.graphContainer, element, true);

        this.hoverElement = element;
    }


    private static performHighlightingSelection(e: Element) {

        const gElement: Element|undefined = GraphManipulation.getGElement(e);

        if (gElement) {
            const elementType: GraphManipulation.ElementType = GraphManipulation.getElementType(gElement);
            if (elementType !== 'node') return;
            gElement.setAttribute('stroke',
                !gElement.getAttribute('stroke') || gElement.getAttribute('stroke') === ''
                    ? '#afafaf'
                    : '');
        }
    }


    private static removeTitleElements(svg: SVGSVGElement) {

        const rootElement: SVGGElement = svg.getElementsByTagName('g')[0];
        rootElement.removeChild(rootElement.getElementsByTagName('title')[0]);

        for (let i = 0; i < rootElement.children.length; i++) {
            const titleElements: NodeListOf<HTMLTitleElement>
                = rootElement.children[i].getElementsByTagName('title');
            if (titleElements.length == 1) rootElement.children[i].removeChild(titleElements[0]);
        }
    }


    private static configurePanZoomBehavior(svg: SVGSVGElement) {

        const panZoomBehavior: SvgPanZoom.Instance = svgPanZoom(svg, {
            dblClickZoomEnabled: false
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