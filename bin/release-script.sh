#!/bin/bash

latest_zip=."/dist/latest.zip"
latest_extension="./dist/extension.zip"
# 在项目根目录下面运行
current_path=`pwd`
if [[ $current_path =~ bin$ ]]; then
    cd ..
fi

if ! command -v git &> /dev/null
then
    echo "git could not be found"
    exit
fi

if [ -e $latest_zip ]
then
    rm $latest_zip
    echo "remove zip file"
fi
git archive -o $latest_zip HEAD

if ! command -v 7z &> /dev/null
then
    echo "7z could not be found"
    exit
fi

if [ -e $latest_extension ]
then
    rm $latest_extension
    echo "remove extension file"
fi
# bash 下
# hash 7z;  type 7z
cd extension
if [ $? -eq 0 ]; then
    # 生成 extension.zip
    7z a -tzip ../dist/extension.zip "*.*" -r
else
    echo "extension do not exist"
fi
