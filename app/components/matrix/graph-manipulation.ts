import {ElementRef} from "@angular/core";
import 'viz.js';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module GraphManipulation {

    export type ElementType = 'node'|'edge'|undefined;

    export type EdgeType = 'is-after'|'is-contemporary-with'|undefined;

    const hoverColor: string = '#6e95de';

    const defaultColor: string = '#000000';


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


    export function removeTitleElements(svg: SVGSVGElement) {

        const rootElement: SVGGElement = svg.getElementsByTagName('g')[0];
        rootElement.removeChild(rootElement.getElementsByTagName('title')[0]);

        for (let i = 0; i < rootElement.children.length; i++) {
            const titleElements: NodeListOf<HTMLTitleElement>
                = rootElement.children[i].getElementsByTagName('title');
            if (titleElements.length == 1) rootElement.children[i].removeChild(titleElements[0]);
        }
    }


    export function getGElement(element: Element): Element|undefined {

        do {
            if (element.tagName === 'g') return element;
            element = element.parentNode as HTMLElement;
        } while (element);

        return undefined;
    }


    export function setHighlighting(
        graphContainer: ElementRef, element: Element, highlight: boolean) {

        const elementType: ElementType = getElementType(element);

        if (elementType == 'node') {
            setEdgesHighlighting(graphContainer, getResourceId(element), highlight);
        } else if (elementType == 'edge') {
            setEdgeHighlighting(element, highlight, getEdgeType(element));
        }
    }


    export function getElementType(gElement: Element): ElementType {

        if (gElement.id.startsWith('node')) {
            return 'node';
        } else if (gElement.id.startsWith('edge')) {
            return 'edge';
        } else return undefined;
    }


    function setEdgesHighlighting(
        graphContainer: ElementRef, id: string, highlight: boolean) {

        setEdgesHighlightingForType(
            graphContainer, 'is-after', id, highlight);
        setEdgesHighlightingForType(
            graphContainer, 'is-contemporary-with', id, highlight);
    }


    function setEdgeHighlighting(edge: Element, highlight: boolean, edgeType: EdgeType) {

        const color: string = highlight ? hoverColor : defaultColor;
        const strokeWidth: string = highlight ? '2' : '1';

        const path = edge.getElementsByTagName('path')[0];
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);

        if (edgeType === 'is-after') {
            const polygon = edge.getElementsByTagName('polygon')[0];
            polygon.setAttribute('stroke', color);
            polygon.setAttribute('fill', color);
        }
    }


    function setEdgesHighlightingForType(
        graphContainer: ElementRef,
        edgeType: EdgeType, id: string, highlight: boolean) {

        const edges: HTMLCollection
            = graphContainer.nativeElement.getElementsByClassName(edgeType + '-' + id);

        for (let i = 0; i < edges.length; i++) {
            setEdgeHighlighting(edges[i], highlight, edgeType);
        }
    }


    function getEdgeType(edge: Element): EdgeType {

        const classAttribute: string|null = edge.getAttribute('class');

        if (classAttribute && classAttribute.includes('is-after')) {
            return 'is-after';
        } else if (classAttribute && classAttribute.includes('is-contemporary-with')) {
            return 'is-contemporary-with';
        } else return undefined;
    }


    function getResourceId(gElement: Element): string {

        return gElement.id.substring(gElement.id.indexOf('-') + 1);
    }
}