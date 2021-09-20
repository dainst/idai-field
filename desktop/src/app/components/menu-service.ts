import { Injectable } from '@angular/core';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


type MenuContext = 'default'|'docedit'|'modal'|'projects'|'geometryEdit'|'mapLayersEdit'|'georeferenceEdit';


export module MenuContext {

    export const DEFAULT = 'default';
    export const DOCEDIT = 'docedit';
    export const MODAL = 'modal';
    export const PROJECTS = 'projects';
    export const GEOMETRY_EDIT = 'geometryEdit';
    export const MAP_LAYERS_EDIT = 'mapLayersEdit';
    export const GEOREFERENCE_EDIT = 'georeferenceEdit';
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuService {

    private context: MenuContext;


    public getContext = () => this.context;


    public setContext(context: MenuContext) {

        this.context = context;
        if (remote) remote.getGlobal('setMenuContext')(context);
    }
}
