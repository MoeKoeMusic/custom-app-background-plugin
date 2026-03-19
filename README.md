# MoeKoe 自定义软件背景插件

为 MoeKoe Music 1.6.1+ 提供自定义背景图能力，支持本地图片路径保存、透明度调节。

## 功能说明

- 选择本地图片作为软件背景
- 调节背景透明度
- 仅保存图片本地路径（不保存 Base64）
- 下次启动按已保存路径自动加载

## 安装方式

### 方式一：软件内自动安装（推荐）

适用场景：插件已上架到 MoeKoe 插件市场。

1. 打开 `设置 -> 插件管理`
2. 切换到 `插件市场`
3. 搜索插件并点击 `安装`
4. 安装完成后刷新插件列表或重启应用

### 方式二：GitHub 手动下载安装

1. 从 GitHub 下载本项目源码（`Code -> Download ZIP`）
2. 解压后找到目录：`plugins/extensions/custom-app-background`
3. 安装方式二选一：
4. 复制文件夹到 MoeKoe 插件目录（`plugins/extensions`），然后在插件管理中刷新
5. 或将该文件夹打包为 zip，在 `设置 -> 插件管理 -> 安装插件` 中选择 zip 安装

## 使用方法

1. 打开 `设置 -> 插件管理 -> 已安装插件`
2. 找到本插件并点击 `打开弹窗`
3. 点击 `Choose Local Image` 选择本地图片
4. 调整透明度并点击 `Save`
5. 需要恢复默认时点击 `Clear`

## 配置存储

插件使用 `chrome.storage.local`，键名为 `customAppBackground`。

```json
{
  "enabled": true,
  "imagePath": "D:\\\\wallpaper\\\\bg.jpg",
  "opacity": 0.35
}
```

## 注意事项

- 仅在 Electron 桌面端可用，Web 端不支持本地文件路径
- 如果图片路径失效（文件被移动/删除），背景将无法加载
- 建议使用分辨率适中、体积较小的图片以保证性能

![](143055.png)