import {IdaiFieldAppConfigurator} from '../../../../src/field/model/idai-field-app-configurator';
import {ConfigLoader} from '../../../../src/core/configuration/config-loader';

/**
 * @author Daniel de Oliveira
 */
describe('IdaiFieldAppConfigurator', () => {

    xit('should run', (done) => {

        /*
            const http = jasmine.createSpyObj('http',
                ['get']);

            http.get.and.returnValue({ subscribe: (cb) =>
                {cb({"_body": JSON.stringify({
                        types: [
                            {type: "ConcreteOperation", parent: 'Operation'},
                            {type: "B"},
                        ],
                        relations:[
                            { name: 'isRecordedIn', domain: ['B'], label: "Gehört zu",
                                range: ['ConcreteOperation'], inverse: 'NO-INVERSE', visible: false, editable: false },
                        ]
                    }
                )})}}
            );

            const configLoader = new ConfigLoader(http);

            new IdaiFieldAppConfigurator(configLoader).go(
                'democonf',
                undefined
            );

            (configLoader.getProjectConfiguration() as any).then(
                projectConfiguration => {
                    expect(
                        projectConfiguration.getRelationDefinitions(
                            "ConcreteOperation")
                                .filter((dfn) => dfn.name == 'isRecordedIn')[0].range[0])
                        .toEqual('Project');
                    done();
                }
            ).catch(e => fail(e));*/
        }
    );
});