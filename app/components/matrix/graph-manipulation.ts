import {ElementRef} from '@angular/core';
import 'viz.js';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module GraphManipulation {

    const hoverColor: string = '#6e95de';
    const defaultColor: string = '#000000';

    export type ElementType = 'node'|'edge'|undefined;
    export type EdgeType = 'above'|'same-rank'|undefined;


    export function removeTitleElements(svg: SVGSVGElement) {

        const rootElement: SVGGElement = svg.getElementsByTagName('g')[0];
        rootElement.removeChild(rootElement.getElementsByTagName('title')[0]);

        for (let i = 0; i < rootElement.children.length; i++) {
            const titleElements: NodeListOf<HTMLTitleElement>
                = rootElement.children[i].getElementsByTagName('title');
            if (titleElements.length == 1) rootElement.children[i].removeChild(titleElements[0]);
        }
    }


    export function addClusterSubgraphLabelBoxes(svg: SVGSVGElement, htmlDocument: Document) {

        const graphElement = svg.getElementsByClassName('graph')[0];
        const clusterElements: NodeListOf<Element> = svg.getElementsByClassName('cluster');
        const clusterLabelGroupElement: Element = createSVGElement('g', htmlDocument);

        for (let i = 0; i < clusterElements.length; i++) {
            const labelElement: Element = createSVGElement('g', htmlDocument);
            const textElement: SVGTextElement = clusterElements[i].getElementsByTagName('text')[0];
            const rectElement: Element = createSVGElement('rect', htmlDocument);
            rectElement.setAttribute('x', textElement.getBBox().x.toString());
            rectElement.setAttribute('y', textElement.getBBox().y.toString());
            rectElement.setAttribute('width', textElement.getBBox().width.toString());
            rectElement.setAttribute('height', textElement.getBBox().height.toString());
            rectElement.setAttribute('fill', 'aliceblue');
            textElement.setAttribute('font-size', '12.00');
            textElement.setAttribute('fill', 'grey');
            clusterElements[i].removeChild(textElement);
            labelElement.appendChild(rectElement);
            labelElement.appendChild(textElement);
            clusterLabelGroupElement.appendChild(labelElement);
        }

        graphElement.appendChild(clusterLabelGroupElement);
    }


    export function performHighlightingSelection(e: Element) {

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


    export function setHoverElement(graphContainer: ElementRef, element: Element,
                                    hoverElement: Element|undefined) {

        if (hoverElement && hoverElement === element) return hoverElement;

        if (hoverElement) GraphManipulation.setHighlighting(graphContainer, hoverElement, false);
        GraphManipulation.setHighlighting(graphContainer, element, true);

        return element;
    }


    export function setHighlighting(graphContainer: ElementRef, element: Element, highlight: boolean) {

        const elementType: ElementType = getElementType(element);

        if (elementType == 'node') {
            setEdgesHighlighting(graphContainer, getResourceId(element), highlight);
        } else if (elementType == 'edge') {
            setEdgeHighlighting(element, highlight, getEdgeType(element));
        }
    }


    function setEdgesHighlighting(graphContainer: ElementRef, id: string, highlight: boolean) {

        setEdgesHighlightingForType(
            graphContainer, 'above', id, highlight);
        setEdgesHighlightingForType(
            graphContainer, 'same-rank', id, highlight);
    }


    function setEdgesHighlightingForType(graphContainer: ElementRef, edgeType: EdgeType, id: string,
                                         highlight: boolean) {

        const edges: HTMLCollection
            = graphContainer.nativeElement.getElementsByClassName(edgeType + '-' + id);

        for (let i = 0; i < edges.length; i++) {
            setEdgeHighlighting(edges[i], highlight, edgeType);
        }
    }


    function setEdgeHighlighting(edge: Element, highlight: boolean, edgeType: EdgeType) {

        const color: string = highlight ? hoverColor : defaultColor;
        const strokeWidth: string = highlight ? '2' : '1';

        const path = edge.getElementsByTagName('path')[0];
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);

        if (edgeType === 'above') {
            const polygon = edge.getElementsByTagName('polygon')[0];
            polygon.setAttribute('stroke', color);
            polygon.setAttribute('fill', color);
        }
    }


    export function getGElement(element: Element): Element|undefined {

        do {
            if (element.tagName === 'g') return element;
            element = element.parentNode as HTMLElement;
        } while (element);

        return undefined;
    }


    function getEdgeType(edge: Element): EdgeType {

        const classAttribute: string|null = edge.getAttribute('class');

        if (classAttribute && classAttribute.includes('above')) {
            return 'above';
        } else if (classAttribute && classAttribute.includes('same-rank')) {
            return 'same-rank';
        } else return undefined;
    }


    export function getElementType(gElement: Element): ElementType {

        if (gElement.id.startsWith('node')) {
            return 'node';
        } else if (gElement.id.startsWith('edge')) {
            return 'edge';
        } else return undefined;
    }


    function getResourceId(gElement: Element): string {

        return gElement.id.substring(gElement.id.indexOf('-') + 1);
    }


    function createSVGElement(type: string, htmlDocument: Document): Element {

        return htmlDocument.createElementNS('http://www.w3.org/2000/svg', type);
    }
}