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

# move build to target folder
mv -f ./build ../../dist/web

# pop back out
cd -