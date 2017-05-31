#! /bin/sh

tsc

cp -r ./src/config ./dist/
cp ./src/lib/contacts.json ./dist/lib/contacts.json