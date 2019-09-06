###### 项目未引用图片过滤脚本 #######

   该脚本可以过滤出除动态加载外的所有未被引用的图片,使用者可以根据对项目的了解删除未引用的图片
   
   删图有风险,操作需谨慎!!! 
   请在删图之前,做好备份!!!

### 配置文件介绍 ###

 {
    "projectPath": "E:/works/WhClient/WhClient.proj/assets",  //项目目录  配置到assets路径下
    "outputPath": "./outPut/wh_201908091605.json",            //未引用图片信息的输出路径 
    "isUseWhiteTable": true,                                  //是否使用白名单 如果配置为false 则白名单路径无效
    "whiteTablePath": "./whiteTable/wh_white.json"            //白名单路径  isUseWhiteTable:false  该路径为""即可 
 }

### 注意事项 ###

1. 粒子系统的引用  如果你确定改图片是制作时所引用的图片 请不要删除该图片

### 使用说明 ###

1. 配置 exec_config.json
3. 确认配置完成后,双击bat运行脚本即可
2. 在经过全面的删除后,可再运行一次该脚本生成一个白名单配置

### 如有疑问 ### 
联系: mxr/wwx