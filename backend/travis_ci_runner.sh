#!/bin/sh
cd backend;

if gulp eslint; 
then
    echo "Passed linting"
else
    exit 1;
fi


if gulp test;
then
    echo "Passed linting"
else
    exit 1;
fi
