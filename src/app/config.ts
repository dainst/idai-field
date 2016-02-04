export const CONFIG = {
	environment: 'development', // choose 'test', 'development' or 'production'

    backend : {
        //uri: 'http://virginiaplain01.klassarchaeologie.uni-koeln.de:80',
        uri: 'http://localhost:9200/idaifield/',
        credentials: 'admin:s3cr3t',
        connectionCheckInterval: 1000
    }
};