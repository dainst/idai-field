# Unit Test Troubleshooting

Before running the tests, it might be necessary that an appropriate 
`ulimit` has to set for karma to run properly.

```
$ ulimit -n 10000
```

It is necessary that the config files (`config/`) exist (which should
be the case after running `npm run build`) when running the unit tests. 
Otherwise this will lead to some
strange behaviour of the test runner with an output like

```
24 01 2017 18:49:13.383:WARN [web-server]: 404: /base/config/config.json
Chrome 55.0.2883 (Mac OS X 10.12.0) ERROR: Error{originalErr: Error{}}
```

which can be a result of custom json loading as it is done from within `IndexeddbDatastore`
using `app/util/systemjs-json-plugin`.

It is strongly recommended that it is grepped for WARN and ERROR when doing CI,
since both of them will not lead to an exit code other than `0`.
