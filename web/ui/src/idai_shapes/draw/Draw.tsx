import React, { ReactElement, useState, useRef, CSSProperties } from 'react';
import { Col, Button, Form } from 'react-bootstrap';
import CanvasDraw, { DrawCanvasObject } from '../drawcanvas/DrawCanvas';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export default function Draw(): ReactElement {

    const [brushRadius, setBrushRadius] = useState<number>(10);
    const { t } = useTranslation();
    const history = useHistory();
    const canvas = useRef<DrawCanvasObject>();

    const findHandler = () => {

        history.push(`drawfinds/true/${encodeURIComponent(canvas.current.getCanvas().toDataURL())}`);
    };

    const brushRadiusHandler = (e: React.ChangeEvent<HTMLInputElement>) => {

        setBrushRadius(parseInt(e.target.value));
    };

    const clearHandler = () => {

        canvas.current && canvas.current.clear();
    };

    return (
        <>
            <CanvasDraw brushRadius={ brushRadius } ref={ canvas } />
            <Button
                variant="primary"
                className="mx-1 mt-1"
                style={ buttonStyle }
                onClick={ findHandler } >
            { t('shapes.draw.search') }
            </Button>
            <Button
                variant="primary"
                className="mt-1"
                style={ buttonStyle }
                onClick={ clearHandler } >
                { t('shapes.draw.clear') }
            </Button>
            <Col>
                <Form.Control type="range" min="5" max="30" custom
                    className="mt-2 w-25" value={ brushRadius }
                    onChange={ brushRadiusHandler } />
                <p>{ t('shapes.draw.brushRadius') }</p>
            </Col>
        </>
    );
}

const buttonStyle: CSSProperties = {
    borderColor: 'white',
    borderStyle: 'solid',
    borderRadius: '5px'
};