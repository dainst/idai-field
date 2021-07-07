import { History } from 'history';
import React, { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';


interface LinkButtonProps {
    to: string;
    children: ReactNode;
    variant?: 'link' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light'
        | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'outline-warning'
        | 'outline-info' | 'outline-dark' | 'outline-light';
    style?: CSSProperties;
    size?: 'sm' | 'lg';
    tooltip?: ReactElement;
    target?: string;
    className?: string;
}


export default function LinkButton(properties: LinkButtonProps): ReactElement {

    const history = useHistory();

    return properties.tooltip
        ? <OverlayTrigger placement="bottom" overlay={ properties.tooltip } delay={ { show: 500, hide: 0 } }>
            { renderButton(properties, history) }
        </OverlayTrigger>
        : renderButton(properties, history);
}


const renderButton = ({ to, children, style, size, target, className, variant = 'primary' }: LinkButtonProps,
                      history: History) => {

    let onClick = (e: MouseEvent) => { e.preventDefault(); history.push(to); };
    if (target) onClick = (e: MouseEvent) => { e.preventDefault(); window.open(to, target); };

    return <Button onClick={ onClick }
            style={ style }
            size={ size }
            className={ className }
            variant={ variant }>
        { children }
    </Button>;
};
