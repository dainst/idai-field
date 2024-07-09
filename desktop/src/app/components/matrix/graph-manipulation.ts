import { ElementRef } from '@angular/core';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module GraphManipulation {

    const defaultColor: string = '#000000';
    const aboveHighlightColor: string = '#6e95de';
    const belowHighlightColor: string = '#4f9d66';
    const sameRankHighlightColor: string = '#d98a6c';

    export type ElementType = 'node'|'edge'|undefined;
    export type EdgeType = 'above'|'below'|'same-rank'|undefined;


    export function removeTitleElements(svg: SVGSVGElement) {

        const rootElement: SVGGElement = svg.getElementsByTagName('g')[0];

        for (let i = 0; i < rootElement.children.length; i++) {
            const titleElements: HTMLCollectionOf<HTMLTitleElement>
                = rootElement.children[i].getElementsByTagName('title');
            if (titleElements.length == 1) rootElement.children[i].removeChild(titleElements[0]);
        }
    }


    export function addClusterSubgraphLabelBoxes(svg: SVGSVGElement, htmlDocument: Document) {

        const graphElement = svg.getElementsByClassName('graph')[0];
        const clusterElements: HTMLCollectionOf<Element> = svg.getElementsByClassName('cluster');
        const clusterLabelGroupElement: Element = createSVGElement('g', htmlDocument);

        for (let i = 0; i < clusterElements.length; i++) {
            const labelElement: Element = createSVGElement('g', htmlDocument);
            const textElement: SVGTextElement = clusterElements[i].getElementsByTagName('text')[0];
            const rectElement: Element = createSubgraphLabelBoxElement(textElement, htmlDocument);
            adjustSubgraphLabelLayout(textElement);
            clusterElements[i].removeChild(textElement);
            labelElement.appendChild(rectElement);
            labelElement.appendChild(textElement);
            clusterLabelGroupElement.appendChild(labelElement);
        }

        graphElement.appendChild(clusterLabelGroupElement);
    }


    function createSubgraphLabelBoxElement(textElement: SVGTextElement, htmlDocument: Document): Element {

        const rectElement: Element = createSVGElement('rect', htmlDocument);
        rectElement.setAttribute('x', textElement.getBBox().x.toString());
        rectElement.setAttribute('y', textElement.getBBox().y.toString());
        rectElement.setAttribute('width', textElement.getBBox().width.toString());
        rectElement.setAttribute('height', textElement.getBBox().height.toString());
        rectElement.setAttribute('fill', 'aliceblue');

        return rectElement;
    }


    function adjustSubgraphLabelLayout(textElement: SVGTextElement) {

        textElement.setAttribute('font-size', '12.00');
        textElement.setAttribute('fill', 'grey');
    }


    export function markAsSelected(e: Element, selected: boolean) {

        const gElement: Element|undefined = GraphManipulation.getGElement(e);
        if (!gElement || GraphManipulation.getElementType(gElement) !== 'node') return;

        const ellipseElement = gElement.getElementsByTagName('ellipse')[0];

        if (selected && !ellipseElement.classList.contains('selected')) {
            ellipseElement.classList.add('selected');
        } else if (!selected && ellipseElement.classList.contains('selected')) {
            ellipseElement.classList.remove('selected');
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

        if (elementType === 'node') {
            setEdgesHighlighting(graphContainer, getResourceId(element), highlight);
        } else if (elementType === 'edge') {
            setEdgeHighlighting(element, highlight, getEdgeType(element));
        }
    }


    function setEdgesHighlighting(graphContainer: ElementRef, id: string, highlight: boolean) {

        setEdgesHighlightingForType(graphContainer, 'above', id, highlight);
        setEdgesHighlightingForType(graphContainer, 'same-rank', id, highlight);
        setEdgesHighlightingForType(graphContainer, 'below', id, highlight);
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

        const color: string = getEdgeColor(highlight, edgeType);
        const strokeWidth: string = highlight ? '2' : '1';

        const path = edge.getElementsByTagName('path')[0];
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);

        if (edgeType === 'above' || edgeType === 'below') {
            const polygon = edge.getElementsByTagName('polygon')[0];
            polygon.setAttribute('stroke', color);
            polygon.setAttribute('fill', color);
        }
    }


    function getEdgeColor(highlight: boolean, edgeType: EdgeType): string {

        if (!highlight || !edgeType) return defaultColor;

        switch(edgeType) {
            case 'above':
                return aboveHighlightColor;
            case 'below':
                return belowHighlightColor;
            case 'same-rank':
                return sameRankHighlightColor;
        }
    }


    export function getGElement(element: Element): Element|undefined {

        do {
            if (element.tagName === 'g') return element;
            element = element.parentNode as HTMLElement;
        } while (element);

        return undefined;
    }


    export function getParentNodeElement(element: Element|null): Element|undefined {

        while (element) {
            if (element.classList.contains('node')) return element;
            element = element.parentElement;
        }

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


    export function getResourceId(nodeElement: Element): string {

        return nodeElement.id.substring(nodeElement.id.indexOf('-') + 1);
    }


    export function getNodeElement(resourceId: string, svgRoot: SVGSVGElement): Element {

        return svgRoot.getElementById('node-' + resourceId);
    }


    export function createSVGElement(type: string, htmlDocument: Document): Element {

        return htmlDocument.createElementNS('http://www.w3.org/2000/svg', type);
    }
}