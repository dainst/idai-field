import {GraphManipulation} from './graph-manipulation';


/**
 * @author Thomas Kleinke
 */
export class SelectionRectangle {

    private x1: number;
    private y1: number;

    private x2: number;
    private y2: number;

    private svgElement: SVGRectElement;

    private static verticalOffset: number = 110;


    public start(event: MouseEvent, svgRoot: SVGSVGElement, htmlDocument: Document) {

        this.x1 = this.x2 = event.x;
        this.y1 = this.y2 = event.y - SelectionRectangle.verticalOffset;

        this.svgElement = GraphManipulation.createSVGElement('rect', htmlDocument) as SVGRectElement;
        this.svgElement.setAttribute('x', this.x1.toString());
        this.svgElement.setAttribute('y', this.y1.toString());
        this.svgElement.setAttribute('stroke', '#000');
        this.svgElement.setAttribute('stroke-width', '2');
        this.svgElement.setAttribute('stroke-dasharray', '10,10');
        this.svgElement.setAttribute('fill-opacity', '0');
        const gElement = GraphManipulation.createSVGElement('g', htmlDocument);
        svgRoot.appendChild(gElement);
        gElement.appendChild(this.svgElement);
    }


    public update(event: MouseEvent) {

        this.x2 = event.x;
        this.y2 = event.y - SelectionRectangle.verticalOffset;
        this.svgElement.setAttribute('width', this.getWidth().toString());
        this.svgElement.setAttribute('height', this.getHeight().toString());
    }


    public remove(svgRoot: SVGSVGElement) {

        svgRoot.removeChild(this.svgElement.parentElement as Element);
    }


    public getSelectedElements(svgRoot: SVGSVGElement): Array<Element> {

        const selectedElements: Array<Element> = [];
        const ellipseElements = svgRoot.getElementsByTagName('ellipse');

        for (let i = 0; i < ellipseElements.length; i++) {
            if (this.isSelected(ellipseElements[i])) {
                selectedElements.push(ellipseElements[i].parentElement as Element);
            }
        }

        return selectedElements;
    }


    private isSelected(element: Element): boolean {

        const boundingBox = element.getBoundingClientRect();

        return boundingBox.right > this.x1
            && boundingBox.left < this.x2
            && boundingBox.top - SelectionRectangle.verticalOffset < this.y2
            && boundingBox.bottom - SelectionRectangle.verticalOffset > this.y1;
    }


    private getWidth(): number {

        return this.x2 - this.x1;
    }


    private getHeight(): number {

        return this.y2 - this.y1;
    }
}