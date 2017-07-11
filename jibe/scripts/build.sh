#! /bin/sh

# typescript stucc
tsc

# copy static stuff
cp -r ./src/config ./dist/

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