#! /bin/sh

# typescript stuff
tsc

# copy static stuff
cp -r ./src/config ./dist/
cp -r ./src/connector/*.html ./dist/connector

# build web
cd src/web

# install tools
../../node_modules/.bin/bower install
../../node_modules/.bin/polymer build --name .

# clean target folder
rm -rf ../../dist/web
mkdir -p ../../dist/web

# move build to target folder
cp -rf ./build/* ../../dist/web
rm -rf ./build

# pop back out
cd -