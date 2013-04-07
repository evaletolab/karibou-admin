#!/bin/bash

[ -f htaccess ] ||{
  echo "ERROR, your are not on the project directory"
  exit -1;
}
brunch build 
cp htaccess build/.htaccess
cd build && rsync -avu --delete -e 'ssh -p2222' . evaleto@gelux.ch:www/localshop.gelux.ch/

