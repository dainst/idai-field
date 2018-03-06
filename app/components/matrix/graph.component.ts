import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DotBuilder} from './dot-builder';
import * as svgPanZoom from 'svg-pan-zoom';


// TODO Use typings file from viz.js v1.8.1 as soon as it is released
declare var Viz: VizJs.Viz;

declare namespace VizJs {

    interface Viz {
        (src: string, opts?: VizOpts): string | HTMLImageElement
        svgXmlToPngImageElement(svgXml: string, scale: number | undefined, callback: ImageCallback): void
        svgXmlToPngImageElement(svgXml: string, scale?: number): HTMLImageElement
        svgXmlToPngBase64(svgXml: string, scale: number | undefined, callback: ImageCallback): void
    }

    interface ImageCallback {
        (error: Error | null, image: HTMLImageElement): void
    }

    interface VizOpts {
        format?: string
        engine?: string
        scale?: number
        images?: Image[]
        totalMemory?: number,
        files?: File[]
    }

    interface File {
        path: string
        data: string
    }

    interface Image {
        href: string
        height: string
        width: string
    }
}



@Component({
    moduleId: module.id,
    selector: 'graph',
    templateUrl: './graph.html'
})
/**
 * @author Thomas Kleinke
 */
export class GraphComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;

    @ViewChild('graphContainer') graphContainer: ElementRef;


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

        const svg: SVGSVGElement = this.getSvg();
        this.removeTitleElements(svg);
        this.graphContainer.nativeElement.appendChild(svg);
        const zoom: SvgPanZoom.Instance = svgPanZoom(svg);
        zoom.fit();
    }


    private getSvg(): SVGSVGElement {

        const graph: string = new DotBuilder().build(this.documents);
        const svg: string = Viz(graph, { format: 'svg', engine: 'dot' }) as string;

        return new DOMParser().parseFromString(svg, 'image/svg+xml')
            .getElementsByTagName('svg')[0]
    }


    private removeTitleElements(svg: SVGSVGElement) {

        const rootElement: SVGGElement = svg.getElementsByTagName('g')[0];
        rootElement.removeChild(rootElement.getElementsByTagName('title')[0]);

        for (let i = 0; i < rootElement.children.length; i++) {
            const titleElements: NodeListOf<HTMLTitleElement>
                = rootElement.children[i].getElementsByTagName('title');
            if (titleElements.length == 1) rootElement.children[i].removeChild(titleElements[0]);
        }
    }
}