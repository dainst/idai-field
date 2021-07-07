import { Location } from 'history';
import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import { Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Document } from '../../api/document';
import { ResultDocument } from '../../api/result';
import Image from './Image';
import './imagecarousel.css';

const DEFAULT_MAX_IMG_WIDTH = 380;
const DEFAULT_MAX_IMG_HEIGHT = 350;

export interface ImageCarouselProps {
    document: Document;
    images: ResultDocument[];
    location?: Location;
    style?: CSSProperties;
    maxWidth?: number;
    maxHeight?: number;
}

export function ImageCarousel ({ document, images, location, maxWidth = DEFAULT_MAX_IMG_WIDTH,
        maxHeight=DEFAULT_MAX_IMG_HEIGHT, style={} }: ImageCarouselProps): ReactElement {

    return (
        <Carousel className="image-carousel" interval={ null } style={ style }>
            { images?.map(renderImage(document, maxWidth, maxHeight, location)) }
        </Carousel>
    );
}

const renderImage = (document: Document, maxWidth: number, maxHeight: number, location?: Location) =>
    
    function CarouselImage(imageDoc: ResultDocument): ReactNode {

        return (
            <Carousel.Item key={ imageDoc.resource.id }>
                <>
                    { location
                        ?
                            <Link to={ `/image/${document.project}/${imageDoc.resource.id}?r=${location.pathname}` }
                                    className="d-block">
                                <Image
                                    project={ document.project }
                                    id={ imageDoc.resource.id }
                                    maxWidth={ maxWidth } maxHeight={ maxHeight } />
                            </Link>
                        :
                            <Image
                            project={ document.project }
                            id={ imageDoc.resource.id }
                            maxWidth={ maxWidth } maxHeight={ maxHeight } />
                        }
                </>
            </Carousel.Item>
        );
};
