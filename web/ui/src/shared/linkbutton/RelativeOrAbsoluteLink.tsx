import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';


interface RelativeOrAbsoluteLinkProps {
    url: string;
    children: ReactNode;
    style?: CSSProperties;
}


export default function RelativeOrAbsoluteLink({ url, children, style }: RelativeOrAbsoluteLinkProps): ReactElement {
    return /^https?:\/\//.test(url)
        ? <a href={ url } target="_blank" rel="noreferrer" style={ style }>{ children }</a>
        : <Link to={ url } style={ style }>{ children }</Link>;
}
