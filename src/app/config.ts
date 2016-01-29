export const CONFIG = {
	//environment: 'production', // choose 'test', 'development' or 'production'
	environment: 'test', // choose 'test', 'development' or 'production'

    backend : {
        //uri: 'http://localhost:4567', // should be specified without ending /
        uri: 'http://localhost:9200/idaifield', // should be specified without ending /
        credentials: 'admin:s3cr3t',
        connectionCheckInterval: 1000
    }
};