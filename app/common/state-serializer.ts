import {StateType} from './standard-state-serializer';

/**
 * This base class is necessary for the ViewFacade subsystem tests to work
 */
export class StateSerializer {

    public async load(stateType: StateType): Promise<any> {

        return null;
    };


    public async store(stateObject: any, stateType: StateType): Promise<any> {

        return null;
    }


    public async delete(stateType: StateType): Promise<any> {

        return null;
    }
}