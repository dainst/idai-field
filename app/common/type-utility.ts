import {Injectable} from '@angular/core';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration'


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class TypeUtility {


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isImageType(typeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw 'Unknown type "' + typeName + '"';
        return (type.name == 'Image' ||
            (type.parentType && type.parentType.name && type.parentType.name == 'Image'));
    }


    public is3DType(typeName: string): boolean {

        return typeName == 'Model3D';
    }


    public isMediaType(typeName: string): boolean {

        return this.isImageType(typeName) || this.is3DType(typeName);
    }


    public getResourceTypeNames(): string[] {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.isMediaType(type.name))
            .map(type => type.name);
    }


    public getImageTypeNames(): string[] {

        let imageTypeNames: string[] = ['Image'];

        const imageChildTypes: Array<IdaiType> = this.projectConfiguration.getTypesMap()['Image'].children;
        if (imageChildTypes) imageTypeNames = imageTypeNames.concat(
            imageChildTypes.map((type: IdaiType) => type.name)
        );

        return imageTypeNames;
    }


    public get3DTypeNames(): string[] {

        return ['Model3D'];
    }


    public getMediaTypeNames(): string[] {

        return this.getImageTypeNames().concat(this.get3DTypeNames());
    }
}