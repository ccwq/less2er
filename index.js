#!/usr/bin/env node

var fs = require("fs");
var exec = require('child_process').exec;
var path = require("path");
var _root = process.cwd();



//开始
globalLessSuccess()
    .then(run)
    .catch(function(err){
        console.log("执行失败",err);
    })
;


/**
 * 开始扫描并监控
 */
function run(){
    var arguments = process.argv.splice(2);

    var config = {};
    arguments.map(function(el){
        var ar = el.replace(/^--/,"").split("=");
        config[ar[0]] = ar[1];
    })


//没有提供path参数，自动补全，给出提示
    if(!config.path) {
        console.log("params path auto be set to --path=css,style,less");
        config.path = "css,style,less"
    }

    var paths = config.path.split(",").map(function(_path){
        return path.join(_root,_path);
    })



    readDirList(paths,function(filePath,isDir){
        if(isDir)   return;
        if(!/\.less$/.test(filePath)) return;
        compile(filePath)
        var wh = fs.watch(filePath,{interval:1000},function(eventType,fileName){
            compile(filePath)
        })
    });

}


/**
 * 检测全局less，
 * 如果没有安装，自动安装
 * 如果安装失败，退出并给出提示
 * 如果已经安装，或者安装成功 then
 */
function globalLessSuccess(){
    return new Promise(function(resolve,reject){
        //检测是否全局安装less，如果没有安装，给出提示并且退出
        exec("lessc -v", function (error, stdout, stderr) {
            if(!/^lessc/.test(stdout)){
                console.log("!!!!Can't find global less module,will install it by 'npm install -g less';");
                npm_install__g_less()
                    .catch(function(err){
                        reject(err);
                    })
                    .then(function(){
                        console.log("!!!!Global less module be success installed;");
                        resolve();
                    })
                ;
            }else{
                resolve();
            }
        });
    })
}


/**
 * 全局安装less
 * @returns {Promise<any>}
 */
function npm_install__g_less(){
    return new Promise(function(resolve,reject){
        var command = "npm install -g less";
        exec(command, function (error, stdout, stderr) {
            if (error){
                reject(error)
            } else {
                resolve();
            }
        });
    })
}


/**
 * 执行一次对less的编译
 * @param filePath
 */
function compile(filePath){
    var command = simpleTpl(
        'lessc "{filePath}" "{fileNotExt}.css" --js -x --source-map="{fileNotExt}.css.map"',
        {
            filePath:filePath,
            fileNotExt:filePath.split(/\.[^.]+?$/)[0]
        }
    )
    exec(command, function (error, stdout, stderr) {
        if (error) console.log(error);
        else {
            console.log("!!!!compile success:" + filePath);

            //console.error(stdout);
        }
    });
}


/**
 * 模板引擎
 * @param tpl
 * @param opts
 * @returns {string | void | *}
 */
function simpleTpl(tpl,opts){
    return tpl.replace(/(\{.+?\})/g,function(all,cap1){
        return opts[cap1.replace(/\}|\{/g,"")] || "";
    })
}


/**
 * 遍历目录
 * @param path
 * @param handler(file,isDirectory){}
 */
function readDirList(dirlist,handler){
    function readDir(_path){

        fs.readdir(_path,function(err,fileList){
            if(!fileList){
                return;
            }
            fileList.forEach(function(ele){
                fs.stat(_path+"/"+ele,function(err,info){
                    if(info.isDirectory()){
                        handler(path.join(_path,ele),1)
                        readDir(path.join(_path,ele));
                    }else{
                        handler(path.join(_path,ele),0)
                    }
                })
            })
        })
    }

    if(!dirlist.push) {
        dirlist = [dirlist];
    }

    dirlist.forEach(readDir)
}

