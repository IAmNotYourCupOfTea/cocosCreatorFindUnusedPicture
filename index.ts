/**
 * 查找项目中未引用的图片资源
 */
import * as fs from "fs";
import * as path from "path";
import { PictureInfo, DirInfo, OutputInfo, ExecInfo } from "./Bean";

//运行参数配置路径
const EXEC_CONFIG_PATH = `${__dirname}/exec_config.json`
//查找的项目
let USE_PROJECT_PATH = 'E:/works/WhClient/WhClient.proj/assets'
//输出路径
let OUTPUT_PATH = `${__dirname}/outPut/unusedPic.json`
//白名单路径
let WHITE_TABLE_PATH = `${__dirname}/outPut/wh_white.json`
//是否使用白名单过滤
let IS_USE_WHITE_TABLE = false
//const USE_PROJECT_PATH = 'D:/MyCreator/Demo/assets'
//合法的图标类型
const LEGAL_PICTURE_EXT_LIST = ['.png.meta', '.jpg.meta']
//fire文件
const FIRE_FILE = '.fire'
//prefab文件
const PREFAB_FILE = '.prefab'
//.fnt字体文件
const FONT_FILE = '.fnt.meta'
//.labelatlas字体文件
const LABELATLAS_FILE = '.labelatlas.meta'
//.anim文件
const ANIM_FILE = '.anim'
//.plist.meta合图文件
const PLIST_META_FILE = '.plist.meta'

//所有的fire 文件 
let allFireList = []
//所有的prefab 文件
let allPrefabList = []
//所有font 文件引用的uuid
let allFontUsedPicUuidList = []
//所有anim 文件引用的uuid 
let allAnimUsedPicUuidList = []
//所有plist.meta 引用的图片uuid 
let allPlistUsedPicUuidList = []
//所有的图片文件
let allPictureList: PictureInfo[] = []
//未引用的图片
let unusedPicInfoList: PictureInfo[] = []
//按照目录排序后的为使用的文件
let unusedPicInfoOrderByDirList: DirInfo[] = []
//输出信息
let outputInfo: OutputInfo = null
//白名单处理
let whiteTable_unusedPicInfoList: PictureInfo[] = []

//处理参数配置
handlerExecConfig()

function start() {
    console.log('文件分类...')
    findInfo_recursion(USE_PROJECT_PATH)
    // console.log('allFireList:', allFireList)
    // console.log('allPrefabList:', allPrefabList)
    // console.log('allPictureList:', allPictureList)
    //console.log('allFontUsedPicUuidList:', allFontUsedPicUuidList)
    //console.log('allPlistUsedPicUuidList:', allPlistUsedPicUuidList)
    console.log('开始查找...(此过程执行时间较长请耐心等待)')
    findUnsedPic()
    if (IS_USE_WHITE_TABLE) {
        console.log('白名单过滤处理...')
        whiteTable(WHITE_TABLE_PATH)
    }
    // console.log('unusedPicInfoList:', unusedPicInfoList)
    console.log('目录分类...')
    orderByDir()
    // console.log('unusedPicInfoOrderByDirList:', unusedPicInfoOrderByDirList)
    console.log('开始统计文件生成...')

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputInfo, null, 4), { encoding: 'utf8' })

    console.log('输出统计文件:', OUTPUT_PATH)
}


//图片按照目录排序
function orderByDir() {
    outputInfo = new OutputInfo()
    let picUuidList = []
    for (const pic of unusedPicInfoList) {
        findDirName(pic)
        picUuidList.push(pic.self_uuid)
    }
    outputInfo.dirInfo = unusedPicInfoOrderByDirList
    outputInfo.picUuidList = picUuidList
}

function findDirName(pic: PictureInfo) {
    let rootName = path.dirname(pic.path)
    for (const dir of unusedPicInfoOrderByDirList) {
        if (dir.path == rootName) {
            dir.subFiles.push(pic.name)
            return
        }
    }
    let dirInfo = new DirInfo()
    dirInfo.path = rootName
    dirInfo.subFiles = [pic.name]
    unusedPicInfoOrderByDirList.push(dirInfo)
}

//查找未使用的图片
function findUnsedPic() {
    let fireAndPrefabList = allFireList.concat(allPrefabList)
    outer:
    for (const picItem of allPictureList) {
        let spriteFrame_uuid = picItem.spriteFrame_uuid
        let self_uuid = picItem.self_uuid
        for (const fireOrPrefabFile of fireAndPrefabList) {
            let content = fs.readFileSync(fireOrPrefabFile, { encoding: 'utf8' })
            if (content.indexOf(spriteFrame_uuid) != -1) {
                continue outer;
            }
        }
        if (allFontUsedPicUuidList.indexOf(self_uuid) != -1) {
            continue
        }
        if (allAnimUsedPicUuidList.indexOf(spriteFrame_uuid) != -1) {
            continue
        }
        if (allPlistUsedPicUuidList.indexOf(self_uuid) != -1) {
            continue
        }
        unusedPicInfoList.push(picItem)
    }
}
//递归查找资源 fire prefab picture
function findInfo_recursion(filePath: string) {
    let files = fs.readdirSync(filePath)
    //console.log('files:', files)
    files.forEach((file) => {
        let subFilePath = filePath + '/' + file
        //console.log('file:', file)
        if (fs.statSync(subFilePath).isDirectory()) {
            //目录
            //console.log('dir:', subFilePath)
            return findInfo_recursion(subFilePath)
        } else {
            //文件
            let extname = path.extname(file)
            let isFontMetaFile = file.indexOf(FONT_FILE) != -1
            let isLabelatlasFile = file.indexOf(LABELATLAS_FILE) != -1
            let isAnimFile = extname == ANIM_FILE
            let isPlistMetaFile = extname == '.meta' && file.indexOf(PLIST_META_FILE) != -1
            //console.log('file:', subFilePath)
            let isPic = false
            for (const type of LEGAL_PICTURE_EXT_LIST) {
                if (file.indexOf(type) != -1) {
                    isPic = true
                    break
                }
            }
            if (extname == FIRE_FILE) {
                //fire 
                allFireList.push(subFilePath)
            } else if (extname == PREFAB_FILE) {
                //prefab
                allPrefabList.push(subFilePath)
            } else if (isFontMetaFile) {
                //font.meta
                allFontUsedPicUuidList.push(getFontUsedPicUuid(subFilePath))
            } else if (isLabelatlasFile) {
                //labelaltas.meta
                //console.log('labelaltas格式字体:', subFilePath)
                allFontUsedPicUuidList.push(getLabelatlasUsedPicUuid(subFilePath))
            } else if (isAnimFile) {
                //.anim
                allAnimUsedPicUuidList = allAnimUsedPicUuidList.concat(getAnimUsedPicUuid(subFilePath))
            } else if (isPlistMetaFile) {
                //.plist.meta
                let self_uuid = getPlistUsedPicUuid(subFilePath)
                if (self_uuid) allPlistUsedPicUuidList.push(self_uuid)
            } else if (isPic) {
                //图片
                let picInfo = getPictureInfo(subFilePath)
                if (picInfo) allPictureList.push(picInfo)
            }
        }
    })
}


//获取图片的详细信息
function getPictureInfo(picPath: string): PictureInfo {
    let picMetaContent = fs.readFileSync(picPath, { encoding: 'utf8' })
    let picMetaContentObj = JSON.parse(picMetaContent)
    //图片名字
    let pic_name = path.basename(picPath, '.meta')
    //console.log('baseName:', pic_name)
    let ext = ''
    for (const i of LEGAL_PICTURE_EXT_LIST) {
        if (picPath.indexOf(i) != -1) {
            ext = i
            break
        }
    }
    let pic_name_noExt = path.basename(picPath, ext)
    //console.log('pic_name_noExt:', pic_name_noExt, 'ext:', ext)

    //图片路径
    let pic_path = path.dirname(picPath) + '/' + pic_name
    // console.log('pic_path:', pic_path)
    let picInfo = new PictureInfo()
    //图片本身uuid
    try {
        let self_uuid = picMetaContentObj['uuid']
        let subMetas_info = picMetaContentObj['subMetas']
        let pic_name_info = subMetas_info[pic_name_noExt]
        //图片纹理 uuid 
        let spriteFrame_uuid = pic_name_info['uuid']


        picInfo.name = pic_name_noExt
        picInfo.path = pic_path
        picInfo.self_uuid = self_uuid
        picInfo.spriteFrame_uuid = spriteFrame_uuid
    } catch (error) {
        console.error('出错的图片:', picPath)
        //console.error('error:', error)
        return null
    }
    return picInfo
}


//获取.fnt对图片的引用
function getFontUsedPicUuid(fontMetaPath: string) {
    let fontMetaContent = fs.readFileSync(fontMetaPath, { encoding: 'utf8' })
    let fontMetaContentObj = JSON.parse(fontMetaContent)
    let textureUuid = fontMetaContentObj['textureUuid'] //引用的图片的uuid
    return textureUuid
}
//获取.labellatlas 对图片引用
function getLabelatlasUsedPicUuid(labelatlasMetaPath: string) {
    let labelatlasMetaContent = fs.readFileSync(labelatlasMetaPath, { encoding: 'utf8' })
    let labelatlasMetaContentObj = JSON.parse(labelatlasMetaContent)
    let rawTextureUuid = labelatlasMetaContentObj['rawTextureUuid'] //引用的图片的uuid
    return rawTextureUuid
}
//处理.anim 对图片的引用
function getAnimUsedPicUuid(animFilePath: string) {
    let picUuidList: string[] = []
    let animContent = fs.readFileSync(animFilePath, { encoding: 'utf8' })
    let animContentArr = animContent.split('"__uuid__": "')
    animContentArr.shift()
    animContentArr.forEach((item) => {
        picUuidList.push(item.split('"').shift()) //spriteFrame_uuid
    })
    picUuidList = picUuidList.filter((value, index, arr) => {
        return arr.indexOf(value) == index
    })
    //console.log(picUuidList)
    return picUuidList
}

//处理.plist合图对图片引用
//.plist.meta  rawTextureUuid == self_uuid
function getPlistUsedPicUuid(plistMetaPath: string) {
    let plistCotent = fs.readFileSync(plistMetaPath, { encoding: 'utf8' })
    let plistContentObj = JSON.parse(plistCotent)
    if (plistContentObj['rawTextureUuid']) {
        // console.log('plist合图:', plistMetaPath)
        return plistContentObj['rawTextureUuid']
    }
    return null
}

//白名单处理
function whiteTable(whitePath: string) {
    if (fs.existsSync(whitePath)) {
        //白名单过滤
        let content = fs.readFileSync(whitePath, { encoding: 'utf8' })
        let outputInfoObj: OutputInfo = JSON.parse(content)
        let picUuidList = outputInfoObj.picUuidList
        //console.log(dirInfoArr[0])
        for (const item of unusedPicInfoList) {
            //不在白名单中
            if (picUuidList.indexOf(item.self_uuid) == -1) {
                whiteTable_unusedPicInfoList.push(item)
            }
        }
        unusedPicInfoList = whiteTable_unusedPicInfoList
    } else {
        //白名单不存在
        console.log('未配置白名单')
    }
}

//处理运行参数配置
function handlerExecConfig() {
    if (fs.existsSync(EXEC_CONFIG_PATH)) {
        let content = fs.readFileSync(EXEC_CONFIG_PATH, { encoding: 'utf8' })
        let obj: ExecInfo = JSON.parse(content)
        console.log('处理参数配置:\n', obj)
        USE_PROJECT_PATH = obj.projectPath
        OUTPUT_PATH = obj.outputPath
        WHITE_TABLE_PATH = obj.whiteTablePath
        IS_USE_WHITE_TABLE = obj.isUseWhiteTable
    } else {
        console.error('运行参数配置文件不存在', EXEC_CONFIG_PATH)
        process.exit(1)
    }
}

// whiteTable(wh_whiteTable)
start()

