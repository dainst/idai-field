import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { getReadableProjects, Token } from '../../api/auth';
import { getShowTasks, postConvert, postReindex, postStop, postTiling } from '../../api/worker';
import { LoginContext } from '../../shared/login';
import Tasks from './Tasks';


export type TaskType = 'reindex'|'convert'|'tiling'|'stop';


const BUTTONS: [TaskType, string, string][] = [
    ['reindex', 'Reindex', 'green'],
    ['convert', 'Convert', 'green'],
    ['tiling', 'Tiling', 'green'],
    ['stop', 'Stop', 'blue']
];


const WIDTH = 70;


export default function Dashboard(): ReactElement {

    const loginData = useContext(LoginContext);
    const [projects, setProjects] = useState<string[]>([]);
    const [stat, setStat] = useState<string[]>([]);
    
    useEffect(() => {

        getReadableProjects(loginData.token).then(projects => {

            const allProjects = ['All projects'].concat(projects);
            setProjects(allProjects);
        });
    }, [loginData]);

    return (<div className="container">
        <h3 style={ headingStyle }>{ 'Dashboard' }</h3>
        <div className="row">
        { loginData.isAdmin === true &&
        <div className="col-md-6">
            <p style={ paragraphStyle }>{ 'Projects'}
            </p>
            <div>
                { projects.map((project, index) =>
                    (<div key={ index } style={ projectRowStyle }>
                        <div style={ projectNameStyle }>
                            { project }</div>
                        <Tasks project={ project }
                            exec={ call(loginData.token, setStat) }
                            buttons={ BUTTONS }
                            itemWidth={ WIDTH }></Tasks>
                        { project === 'All projects'
                            && <div style={ buttonDivStyle }>
                                <span className="btn"
                                    style={ buttonSpanStyle }
                                    onClick={
                                        () => (getShowTasks(loginData.token)).then(setStat)
                                    }>
                                    Info
                                </span>
                            </div>
                        }
                    </div>)
                )}
            </div>
        </div>
        }
        <div className="col-md-6" style={ sideStyle }>
            { stat.length === 0 && 'idle...' }
            { stat.length !== 0 && stat.map((line, index) => {

                return <p key={ index }>{ line }</p>;

            }) }
        </div>
        </div></div>);
}


const call = (token: Token, setStat: (s: string[]) => void) =>
    async (project: string, cmd: TaskType) => {

    switch(cmd) {
        case 'reindex': setStat(await postReindex(token, project) as string[]); break;
        case 'convert': setStat(await postConvert(token, project) as string[]); break;
        case 'tiling': setStat(await postTiling(token, project) as string[]); break;
        case 'stop': setStat(await postStop(token, project) as string[]); break;
    }
};


const projectRowStyle: CSSProperties = {
    height: '96px',
    position: 'relative'
};


const projectNameStyle: CSSProperties = {
    width: '200px',
    left: '0px',
    top: '0px',
    height: '44px',
    position: 'relative'
};


const buttonDivStyle: CSSProperties = {
    left: '210px',
    top: '0px',
    height: '22px',
    width: 'calc(100vh - 200px)',
    position: 'absolute',
};


const buttonSpanStyle: CSSProperties = {
    position: 'relative',
    left: '0px',
    top: '0px',
    padding: '0',
    color: 'blue'
};


const sideStyle: CSSProperties = {

    paddingTop: '20px',
    fontFamily: 'monospace',
    color: 'white',
    backgroundColor: 'black',
    height: 'calc(100vh - 138px)'
};


const headingStyle: CSSProperties = {
    paddingTop: '10px',
    paddingBottom: '13px',
    textAlign: 'center',
    marginBottom: '15px'
};


const paragraphStyle: CSSProperties = {
    height: '64px',
    width: '1000px',
    marginRight: 'auto',
    marginLeft: 'auto'
};
