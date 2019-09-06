//图片信息
class PictureInfo {
    name: string
    path: string
    self_uuid: string //图片本身对应的uuid
    spriteFrame_uuid: string //图片纹理对应的uuid (资源引用的是这个uuid)
}
//目录信息
class DirInfo {
    path: string //目录路径
    subFiles: string[] //子文件
}
//输出信息
class OutputInfo {
    dirInfo: DirInfo[] //目录信息
    picUuidList: string[] //便于白名单使用
}

//项目运行参数
class ExecInfo {
    projectPath: string
    outputPath: string
    isUseWhiteTable: boolean
    whiteTablePath: string
}
export { PictureInfo, DirInfo, OutputInfo, ExecInfo }