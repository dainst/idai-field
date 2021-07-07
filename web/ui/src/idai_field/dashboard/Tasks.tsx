import React, { CSSProperties } from 'react';
import { ReactElement } from 'react';


type TasksProps = {
    project: string,
    exec: (project: string, cmd: string) => void,
    buttons: [string, string, string][],
    itemWidth: number
};


export default React.memo(function Tasks({ project, exec, buttons, itemWidth }: TasksProps): ReactElement {

    return (<div style={ boxStyle }>

        { buttons.map(([type, title, color], i) => (

            <div style={ buttonDivStyle(i, itemWidth) } key={ i }>
                <span className="btn" style={ buttonSpanStyle(color) }
                    onClick={ () => exec(project, type) }>{ title }</span>
            </div>
           )) }
    </div>);
});


const boxStyle: CSSProperties = {
    left: '0px',
    top: '28px',
    position: 'absolute'
};


const buttonDivStyle = (index: number, width: number): CSSProperties => ({
    left: (index * width) + 'px',
    position: 'absolute',
});


const buttonSpanStyle = (color: string): CSSProperties => ({
    padding: '0px',
    color: color
});
