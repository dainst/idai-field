import {
    Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2,
    ViewChild
} from '@angular/core';
import 'viz.js';
import * as svgPanZoom from 'svg-pan-zoom';
import {DotBuilder} from './dot-builder';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';


type ElementType = 'node'|'edge'|undefined;
type EdgeType = 'is-after'|'is-contemporary-with'|undefined;


@Component({
    moduleId: module.id,
    selector: 'graph',
    templateUrl: './graph.html'
})
/**
 * @author Thomas Kleinke
 */
export class GraphComponent implements OnInit, OnChanges {

    @Input() documents: Array<IdaiFieldFeatureDocument>;
    @Output() onSelect: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('graphContainer') graphContainer: ElementRef;

    private hoverElement: Element|undefined;

    private static maxRealZoom: number = 2;
    private static hoverColor: string = '#6e95de';
    private static defaultColor: string = '#000000';

    constructor(private dotBuilder: DotBuilder,
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

        const svg: string = this.createGraph();

        const svgGraph = new DOMParser().parseFromString(svg, 'image/svg+xml')
            .getElementsByTagName('svg')[0];

        GraphComponent.removeTitleElements(svgGraph);
        this.graphContainer.nativeElement.appendChild(svgGraph);
        GraphComponent.configurePanZoomBehavior(svgGraph);
    }


    private createGraph(): string {

        const graph: string = this.dotBuilder.build(this.documents);
        return Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private initializeMouseMoveEventListener() {

        this.renderer.listen(this.graphContainer.nativeElement, 'mousemove', event => {
            this.onMouseMove(event);
        });

        this.renderer.listen(this.graphContainer.nativeElement, 'click', event => {

            if (event.path[0]
                && event.path[0].localName !== 'svg'
                && event.path[0].localName !== 'polygon') {

                if (event.path[0].localName === 'ellipse') {

                    if (event.path[0].nextElementSibling
                        && event.path[0].nextElementSibling.childNodes.length > 0) {

                        if (event.path[0].nextElementSibling.childNodes[0].data) {
                            this.onSelect.emit(event.path[0].nextElementSibling.childNodes[0].data);
                        }
                    }
                } else if (event.path[0].localName === 'text'
                    && event.path[0].innerHTML !== '') {

                    this.onSelect.emit(event.path[0].innerHTML)
                }
            }

        });
    }


    private onMouseMove(event: MouseEvent) {

        const gElement: Element|undefined = GraphComponent.getGElement(event.target as Element);

        if (!gElement) return;

        if (GraphComponent.getElementType(gElement)) {
            this.setHoverElement(gElement);
        } else if (this.hoverElement) {
            this.setHighlighting(this.hoverElement, false);
            this.hoverElement = undefined;
        }
    }


    private setHoverElement(element: Element) {

        if (this.hoverElement && this.hoverElement == element) return;

        if (this.hoverElement) this.setHighlighting(this.hoverElement, false);
        this.setHighlighting(element, true);

        this.hoverElement = element;
    }


    private setHighlighting(element: Element, highlight: boolean) {

        const elementType: ElementType = GraphComponent.getElementType(element);

        if (elementType == 'node') {
            this.setEdgesHighlighting(GraphComponent.getResourceId(element), highlight);
        } else if (elementType == 'edge') {
            GraphComponent.setEdgeHighlighting(element, highlight, GraphComponent.getEdgeType(element));
        }
    }


    private setEdgesHighlighting(id: string, highlight: boolean) {

        this.setEdgesHighlightingForType('is-after', id, highlight);
        this.setEdgesHighlightingForType('is-contemporary-with', id, highlight);
    }


    private setEdgesHighlightingForType(edgeType: EdgeType, id: string, highlight: boolean) {

        const edges: HTMLCollection
            = this.graphContainer.nativeElement.getElementsByClassName(edgeType + '-' + id);

        for (let i = 0; i < edges.length; i++) {
            GraphComponent.setEdgeHighlighting(edges[i], highlight, edgeType);
        }
    }


    private static setEdgeHighlighting(edge: Element, highlight: boolean, edgeType: EdgeType) {

        const color: string = highlight ? this.hoverColor : this.defaultColor;
        const strokeWidth: string = highlight ? '2' : '1';

        const path = edge.getElementsByTagName('path')[0];
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);

        if (edgeType == 'is-after') {
            const polygon = edge.getElementsByTagName('polygon')[0];
            polygon.setAttribute('stroke', color);
            polygon.setAttribute('fill', color);
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


    private static getGElement(element: Element): Element|undefined {

        do {
            if (element.tagName == 'g') return element;
            element = element.parentNode as HTMLElement;
        } while (element);

        return undefined;
    }


    private static getResourceId(gElement: Element): string {

        return gElement.id.substring(gElement.id.indexOf('-') + 1);
    }


    private static getElementType(gElement: Element): ElementType {

        if (gElement.id.startsWith('node')) {
            return 'node';
        } else if (gElement.id.startsWith('edge')) {
            return 'edge';
        } else return undefined;
    }


    private static getEdgeType(edge: Element): EdgeType {

        const classAttribute: string|null = edge.getAttribute('class');

        if (classAttribute && classAttribute.includes('is-after')) {
            return 'is-after';
        } else if (classAttribute && classAttribute.includes('is-contemporary-with')) {
            return 'is-contemporary-with';
        } else return undefined;
    }
}