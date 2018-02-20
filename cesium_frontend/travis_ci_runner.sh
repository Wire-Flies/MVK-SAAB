#!/bin/sh
cd cesium_frontend;


if npm run eslint; 
then
    echo "Passed linting"
else
    exit 1;
fi


