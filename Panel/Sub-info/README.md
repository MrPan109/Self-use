## 功能
1. 查看你机场当前剩余的流量
2. 查看你机场购买套餐的流量
3. 查看你机场重置流量的日期
4. 查看你机场套餐到期的日期

## How to use
### 1. 安装环境
**需要有网络调试工具 Surge ，且要付费至具有面板功能**<br>
最低支持版本 :<br>
>**AppStore 版 4.9.3 或更新版本**<br>
>**TestFlight 版 4.11.0 (2014) 或更新版本**

### 2. 模块安装链接
> **稳定版 :** https://raw.githubusercontent.com/MrPan109/Self-use/Surge%26Loon/Panel/Sub-info/Sub-info.sgmodule<br>

### 3. 安装方式
打开 Surge -> 模块 -> 新建本地模块 -> 复制粘贴上方的安装链接里的模块内容到本地（不是复制链接！）-> 先将带有流量信息的节点订阅链接encode，用encode后的链接替换"url="后面的[机场节点链接] -> 完成!

**encode链接：** https://www.urlencoder.org

> 为什么要encode？
> 1.是因为当字符串数据以url的形式传递给web服务器时,字符串中是不允许出现空格和特殊字符的。

> 2.因为 url 对字符有限制，比如把一个邮箱放入 url，就需要使用 urlencode 函数，因为 url 中不能包含 @ 字符。

> 3.url转义其实也只是为了符合url的规范而已。因为在标准的url规范中中文和很多的字符是不允许出现在url中的。

<img src="assets/iShot_2023-03-19_10.19.15.png" alt="iShot_2023-03-19_10.19.15" style="zoom:50%;" />

这里放一张encode前后对比截图就能知道encode的作用了。

### 4.将encode后的订阅链接替换本地面板里面相应字符

用encode后的链接替换"url="后面的[机场节点链接] -> 完成!

<img src="assets/IMG_1395.PNG" alt="IMG_1395" style="zoom:50%;" />

<img src="assets/iShot_2023-03-19_10.26.29.png" alt="iShot_2023-03-19_10.26.29" style="zoom:50%;" />

### 5. 更新模块方式
**请按照以下步骤更新**<br>
#### 更新外部资源 : 
>点击首页最上方打开 Profile 页面 -> 更新外部资源 <br>

**两次更新之间建议 _ 间隔 5 分钟以上_，否则又几率页面缓存文档尚未更新导致更新失败<br>
(检查方式为 Surge -> 脚本 -> 脚本编辑器 -> 载入 -> Sub_info -> 检查代码是否与网页版本相同**
