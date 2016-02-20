#!/bin/bash
#
# Detects any occurrences of "fit" or "fdescribe".
# in test sources.
#
# Exits with 1 if any occurrences have been found.
# Exits with 0 otherwise.
#
# author: Daniel M. de Oliveira


FDESCRIBE_RES=`grep "fdescribe" src/test/* | grep -v "import" > /dev/null; echo $?`
FIT_RES=`grep "fit" src/test/* | grep -v "import" > /dev/null; echo $?`


ERRS=0
if [ "$FIT_RES" -eq "0" ]; then
	echo ERROR Occurrences of fit found in tests.
	grep "fit" src/test/* -nr | grep -v "import"
	ERRS=1
fi

if [ "$FDESCRIBE_RES" -eq "0" ]; then
	echo ERROR Occurrences of fescribe found in tests.
	grep "fdescribe" src/test/* -nr | grep -v "import" 
	ERRS=1
fi

if [ "$ERRS" -eq "1" ]; then
	exit 1
fi




