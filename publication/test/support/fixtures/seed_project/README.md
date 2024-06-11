The data json was created by first downloading the DAI's testopolis project in Field Desktop, and then running

```
curl -X GET http://testopolis:<your desktop application password>@localhost:3001/testopolis/_all_docs?include_docs=true > data.json
```