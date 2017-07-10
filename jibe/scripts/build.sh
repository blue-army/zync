#! /bin/sh

tsc

cp -r ./src/config ./dist/

# npm install -g polymer-cli

# build web
cd src/web
bower install
polymer build --name .

mkdir -p ../../dist/web
cp -rf ./build/* ../../dist/web
# node ./node_modules/polymer-cli/bin/polymer.js build --name .