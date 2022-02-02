
const axios = require('axios');

process.on('message', (params) => {
    if (!('maxContentLenght' in params)) {
        params.maxContentLength = Infinity;
    }

    if (!('maxBodyLength' in params)) {
        params.maxBodyLength = Infinity;
    }
    
    axios(params).then(function (response) {
        process.send({data: response.data, status: response.status});
    }).catch(function (error) {
        console.error(error)
        process.send({ "error": error })
    }).finally(function() {
        process.exit();
    });
});