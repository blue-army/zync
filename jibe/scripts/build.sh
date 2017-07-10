#! /bin/sh

tsc

cp -r ./src/config ./dist/

# npm install bower
# npm install polymer-cli

# build web
cd src/web

# node ../../node_modules/polymer-cli/bin/polymer.js build --name .
../../node_modules/.bin/bower install
../../node_modules/.bin/polymer build --name .

mkdir -p ../../dist/web
cp -rf ./build/* ../../dist/web
# node ./node_modules/polymer-cli/bin/polymer.js build --name .

cd -