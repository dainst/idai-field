
/*const fs = require('fs');


const projectName: string = 'kalapodi';

const custom = JSON.parse(fs.readFileSync("Config-" + projectName + ".json"));

Object.values(custom).forEach((val: any) => {

   Object.keys(val['fields']).forEach(k => {

       if (val['fields'][k]['valuelistId']) {

           if (!val['valuelists']) val['valuelists'] = {};
           val['valuelists'][k] = val['fields'][k]['valuelistId'];
           delete val['fields'][k]['valuelistId'];
       }
   })
});

fs.writeFileSync("Config-" + projectName + ".json", JSON.stringify(custom, null, 2));*/