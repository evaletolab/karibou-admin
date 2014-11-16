#!/bin/bash

[ -f htaccess ] ||{
  echo "ERROR, your are not on the project directory"
  exit -1;
}
./node_modules/.bin/brunch build --production
cp htaccess build/.htaccess
cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/www.karibou.ch/
