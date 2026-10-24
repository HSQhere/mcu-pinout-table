# 芯片引脚参考 · MCU Pinout Reference

把常见 MCU 的**引脚分布**与**功能复用关系**做成可视化速查表：一张按真实封装排布的引脚图 + 一张可搜索、可按外设筛选的引脚总表，查资料时不用再翻 PDF 找第 47 页那张表。

纯静态页面，零依赖、零构建，双击 `index.html` 就能用。

![纯静态](https://img.shields.io/badge/build-none-brightgreen)
![零依赖](https://img.shields.io/badge/dependencies-0-blue)
![页面](https://img.shields.io/badge/pages-5%20chips%20%C2%B7%202%20series-3f7266)

---

## 目录

- [特性](#特性)
- [已收录芯片](#已收录芯片)
- [快速开始](#快速开始)
- [怎么用](#怎么用)
- [部署到 GitHub Pages](#部署到-github-pages)
- [目录结构](#目录结构)
- [新增一颗芯片](#新增一颗芯片)
- [新增一个系列](#新增一个系列非-stm32)
- [数据字段说明](#数据字段说明)
- [设计约定](#设计约定)
- [数据可信度](#数据可信度)
- [常见问题](#常见问题)
- [许可](#许可)

---

## 特性

- **封装图按实物排布**：LQFP48/64/100、SMD-41 模组、QFN32，四边引脚数与真实封装一一对应，不是四等分糊弄。点任意引脚，下方展开该脚的全部功能。
- **引脚总表可搜索、可筛选**：输入 `usart1`、`PA9`、`42`、`rmii` 都能命中；按串口 / SPI / I2C / CAN / 定时器 / 调试等类别一键过滤。
- **反查视角**：想用某个外设，直接看它能挂在哪些引脚上（外设速查板块）。
- **引脚图与总表联动**：点图上的脚，自动跳到表里对应行并高亮。
- **颜色即语义**：引脚类别（GPIO / 特殊功能 / 电源 / 调试 / 不可用）与复用功能类别各有配色，扫一眼就能区分。
- **不累眼的配色**：浅色低对比米白底 + 墨灰强调，每个系列一套专属强调色；同时提供深色模式并记住选择。
- **响应式**：320px–1400px 无横向溢出，窄屏下封装图与表格可横向滚动、表头吸顶。
- **数据驱动**：所有芯片内容都在 `data/*.js`，页面模板不含任何硬编码芯片信息。加一颗芯片 = 加一个数据文件 + 一行 `<script>`。

---

## 已收录芯片

**STM32 系列**（青绿配色，已与 ST 官方数据手册逐条比对校准）

| 型号 | 系列 | 封装 | 尺寸 / 间距 | 引脚 | 依据手册 |
|---|---|---|---|---|---|
| STM32F103C8T6 | STM32F1 | LQFP48 | 7 × 7 mm / 0.5 mm | 48 | DS5319 Rev 20 · RM0008 |
| STM32F407VET6 | STM32F4 | LQFP100 | 14 × 14 mm / 0.5 mm | 100 | DS8626 Rev 12 · RM0090 |
| STM32G431RBT6 | STM32G4 | LQFP64 | 10 × 10 mm / 0.5 mm | 64 | DS12589 Rev 6 · RM0440 |

**ESP32 系列**（咖啡黄配色，已与乐鑫官方手册逐脚核对）

| 型号 | 系列 | 封装 | 尺寸 / 间距 | 引脚 | 依据手册 |
|---|---|---|---|---|---|
| ESP32-S3-WROOM-1-N16R8 | ESP32-S3 | SMD-41 模组 | 18.0 × 25.5 × 3.1 mm / 1.27 mm | 41（含 EPAD） | ESP32-S3-WROOM-1 Datasheet v1.8 · ESP32-S3 Series Datasheet v2.2 |
| ESP32-C3FH4 | ESP32-C3 | QFN32 | 5 × 5 mm / 0.5 mm | 33（含 GND 焊盘） | ESP32-C3 Series Datasheet v2.4 |

> 收录原则：**按当前封装校验**。当前封装没引出的引脚不列（例如 LQFP100 没有 PF/PG 端口），被内置 Flash / PSRAM 占用的脚标为「不可用」并加删除线，避免照着图接线时用了不存在的焊盘。

---

## 快速开始

### 方式一：直接打开（最简单）

双击根目录的 `index.html` 即可。全部页面都是纯静态文件，不需要安装任何东西、不需要联网。

> 用 `file://` 打开时功能完全正常。唯一差别是浏览器出于安全策略不允许脚本读取本地 CSS 的规则列表，这不影响任何显示效果。

### 方式二：本地起服务（推荐，改代码后刷新即可）

如果你要改样式或加芯片，起一个本地服务更方便：

```bash
# 任选一种，在项目根目录执行
python -m http.server 8000
# 或
npx serve .
```

然后浏览器打开 `http://127.0.0.1:8000/`。

### 方式三：在线访问

部署到 GitHub Pages 后，任何人用浏览器打开 `https://<用户名>.github.io/<仓库名>/` 即可，手机也能看。部署步骤见[下文](#部署到-github-pages)。

---

## 怎么用

### 首页

按**芯片系列**组织。目前两个系列：STM32（青绿）、ESP32（咖啡黄）。点卡片进入系列页。

### 系列页

列出该系列已收录的芯片卡片，顶部搜索框可按型号、封装、关键词过滤（例如输入 `F103`、`LQFP64`、`蓝桥杯`、`S3`、`QFN32`）。

### 芯片详情页

四个板块，对应实际查资料时的四种场景：

| 板块 | 用途 |
|---|---|
| **1 · 封装引脚分布图** | 按真实封装四边排布（LQFP48/64/100、SMD-41 模组、QFN32），与实物引脚位置对应。点任一引脚，下方展开该脚的全部功能。 |
| **2 · 引脚功能总表** | 每行一个引脚。顶部搜索框支持型号、外设名、引脚号模糊搜索；下方按钮可按串口 / SPI / I2C / CAN / 定时器 / 调试等类别筛选。 |
| **3 · 常用外设引脚速查** | 反查视角：想用某个外设，直接看它能挂在哪些引脚上。 |
| **4 · 硬件设计注意事项** | 容易踩坑的点，例如 5V 容限、专用脚限制、BOOT 配置、内置 Flash/PSRAM 占用。 |

**几个实用技巧：**

- 引脚图上的**颜色**代表引脚类别：绿色 = 普通 GPIO，棕色 = 特殊功能脚，灰色 = 电源/地，紫色 = 调试口，灰褐 + 删除线 = 该型号上不可用（如被内置 PSRAM 占用）。图例在封装图下方，只显示当前芯片实际出现的类别。
- 表格里**不同颜色的功能名**代表不同外设类别（串口蓝、SPI 绿、定时器橙、I2C 紫等），扫一眼就能区分。
- 点引脚图上的引脚，会自动跳到总表对应行并高亮，两个板块是联动的。
- 芯片页开头的三张卡片分别跳**嘉立创商城**（中文，可查价查库存）、**原厂英文数据手册 PDF**、**原厂产品页**。
- 搜索框按 `Esc` 可快速清空。
- 右上角图标可切换**深色模式**，选择会记住。
- 手机或窄窗口下，封装图可左右滑动查看；表格也可横向滚动，表头会吸顶。

---

## 部署到 GitHub Pages

**这个仓库的设计目标就是「上传即可用」：没有任何构建步骤、没有依赖、没有后端。**
把文件推上 GitHub，在仓库设置里点三下，就能得到一个公开网址。

### 第一步：把代码上传到 GitHub

本地仓库已经建好并完成首次提交（分支 `main`），只差关联远程仓库。

1. 打开 [github.com/new](https://github.com/new)，**Repository name** 填仓库名（例如 `mcu-pinout`）。
2. **不要**勾选 *Add a README file*、*.gitignore*、*license*——本地已经有了，勾了会造成历史冲突。
3. 点 **Create repository**。新仓库页面上会给出远程地址，复制 HTTPS 那条。
4. 回到项目目录，执行：

```bash
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

之后每次改动只需 `git add -A && git commit -m "说明" && git push`。

> 如果 `git push` 提示要密码：GitHub 早已不接受账号密码，请在
> [Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
> 生成一个勾选 `repo` 权限的 token，把它当密码粘贴。或者改用 SSH 地址（`git@github.com:...`）。

### 第二步：开启 Pages

1. 打开仓库页面 → **Settings** → 左侧 **Pages**。
2. **Source** 选 `Deploy from a branch`。
3. **Branch** 选 `main`，目录选 `/ (root)`，点 **Save**。
4. 等 1–2 分钟，刷新该页面，顶部会出现站点地址：`https://<用户名>.github.io/<仓库名>/`。

**完成。** 之后每次 `git push`，GitHub 会自动重新发布，1 分钟左右生效。

### 为什么能直接用，不用改任何配置

| 常见坑 | 本项目的做法 |
|---|---|
| 绝对路径 `/assets/...` 在子路径站点下失效 | 全部使用相对路径（`assets/...`、`../assets/...`） |
| 单页应用刷新 404 | 不用路由，芯片页靠 `chip.html?id=xxx` 查询参数，是真实的静态文件 |
| Jekyll 处理下划线开头的文件 | 仓库根目录放了 `.nojekyll`，直接按原样发布，跳过 Jekyll |
| 脚本用 `fetch` 读本地数据被 CORS 拦 | 芯片数据以 `<script src>` 方式加载，页面渲染不依赖任何网络请求（`404.html` 里有一次根路径探测，失败会自动降级） |
| 大小写不一致在 Linux 服务器上 404 | 所有引用与实际文件名大小写完全一致 |
| 找不到图标 / 错误链接无提示 | 提供 `assets/favicon.svg` 与根目录 `404.html` |

### 注意事项

- 仓库名如果就叫 `<用户名>.github.io`，站点地址是根域 `https://<用户名>.github.io/`，本项目也能直接访问。
- 文件名带中文（`使用说明.html`）在 Pages 上可以正常访问，链接里的中文会被浏览器自动转义。
- `404.html` 是自包含页面（样式内联、带路径自动探测），即使被服务在任意深度的错误路径下也能正常显示。
- 想自定义域名：同一页面填 **Custom domain**，再到域名商处加一条 CNAME 记录。
- 想临时给别人看而懒得配 Pages：直接分享本地 `index.html` 所在的整个文件夹即可，`file://` 打开功能完全正常（唯一例外是 `404.html` 的根路径探测会被浏览器拦掉，它会保留相对链接，页面照常显示）。

---

## 目录结构

```
MCU pinout table/
├── index.html              # 根入口：芯片系列列表
├── 使用说明.html            # 站内可读的使用文档
├── 404.html                # 错误页（自包含样式，路径自动探测）
├── .nojekyll               # 让 GitHub Pages 跳过 Jekyll，原样发布
├── assets/
│   ├── style.css           # 全部样式（浅色/深色两套设计令牌）
│   ├── app.js              # 全部逻辑：数据注册、渲染、搜索筛选、主题
│   └── favicon.svg         # 站点图标
├── stm32/
│   ├── index.html          # STM32 系列页
│   ├── chip.html           # 芯片详情页模板（通过 ?id= 取数据）
│   ├── 校准报告.md          # 与官方手册的比对结果
│   └── data/
│       ├── f103c8t6.js     # STM32F103C8T6 · LQFP48
│       ├── f407vet6.js     # STM32F407VET6 · LQFP100
│       └── g431rbt6.js     # STM32G431RBT6 · LQFP64
├── esp32/
│   ├── index.html          # ESP32 系列页
│   ├── chip.html           # 芯片详情页模板（同上）
│   └── data/
│       ├── esp32s3wroom1n16r8.js  # ESP32-S3-WROOM-1-N16R8 · SMD-41 模组
│       └── esp32c3fh4.js          # ESP32-C3FH4 · QFN32 裸片
└── README.md
```

**关键设计：页面只有一个模板，芯片数据各自独立。**

`chip.html` 不包含任何具体芯片的信息，它通过 URL 参数 `?id=f103c8t6` 去注册表里取数据，再渲染出来。所以新增一颗芯片不需要复制页面。

---

## 新增一颗芯片

### 1. 新建数据文件

在 `stm32/data/` 下新建 `你的芯片id.js`，结构如下（`MCU.register` 会把它登记进注册表）：

```js
MCU.register({
  id: "stm32h743vit6",          // URL 参数用，建议全小写
  name: "STM32H743VIT6",        // 页面大标题
  family: "STM32H7",            // 系列名
  pkg: "LQFP100",
  pkgSize: "14 × 14 mm",
  pitch: "0.5 mm",
  pinCount: 100,

  tags: ["高性能", "Cortex-M7"],
  spec: [
    ["内核", "Cortex-M7 @ 480 MHz"],
    ["Flash", "2 MB"],
    // ... 建议 8 条，页面上刚好排成 4 列两行
  ],
  intro: "一两句话说明这颗芯片的定位和典型用途。",

  source: {
    datasheet: "DS12110 Rev 8",
    refman: "RM0433 Rev 7"
  },

  // 手册与购买链接（芯片页开头显示）
  links: {
    stProduct:   "https://www.st.com/en/microcontrollers-microprocessors/stm32h743vi.html",
    stDatasheet: "https://www.st.com/resource/en/datasheet/stm32h743vi.pdf",
    lcsc:        "https://item.szlcsc.com/xxxxxxx.html"
  },

  pins: [
    {
      n: 1,                     // 引脚号
      nm: "PE2",                // 引脚名
      ty: "I/O FT",             // 类型：I/O、I、O、电源 S 等，FT 表示 5V 容限
      cat: "GPIO",              // 分类：GPIO / SPEC / PWR / DBG
      ds: "PE2",                // 复位后的默认功能
      af: {                     // 复用功能，按外设类别分组
        "SPI4": ["SPI4_SCK"],
        "TIM":  ["TIM3_ETR"],
        "SYS":  ["TRACECLK"]
      },
      ad: "SAI1_SD_A",          // 附加功能（可选）
      no: "上电时有短暂输出"     // 该脚的特殊注意事项（可选）
    },
    // ... 按引脚号顺序写全
  ],

  // 外设速查：想用某外设时，反查可用引脚
  periph: [
    {
      title: "USART1",
      rows: [
        ["TX", ["PA9", "PB6"]],
        ["RX", ["PA10", "PB7"]]
      ]
    }
  ],

  // 硬件设计注意事项，支持 <b> 加粗、<u> 强调、<br> 换行
  notes: [
    "VDDA 与 VREF+ 需<b>独立滤波</b>，不要直接连数字 3.3V。",
    "PC13–PC15 由电源开关供电，<u>不可作为电流源</u>。"
  ]
});
```

### 2. 在系列页引入

编辑 `stm32/index.html`，在文件底部按同样格式加一行：

```html
<script src="data/stm32h743vit6.js"></script>
```

### 3. 完成

刷新页面，系列页会自动多出一张卡片，详情页通过 `stm32/chip.html?id=stm32h743vit6` 访问。**不需要改任何 JS 或 CSS。**

---

## 新增一个系列（非 STM32）

`esp32/` 就是照这套步骤接进来的完整范例，可以直接照着改：

1. 新建文件夹，例如 `esp32/`
2. 复制 `stm32/index.html` 和 `stm32/chip.html`，把 `../assets/` 路径保持不变即可（都在同一层），再把 `<html>` 的 `data-series` 改成新系列名（`esp32` 用的是 `data-series="esp"`）
3. 新建 `esp32/data/` 放该系列芯片数据，并在两个 HTML 底部按序引入
4. 在根 `index.html` 的 `#series` 区加一张卡片链过去
5. 在 `assets/style.css` 里为该系列加一段配色变量（见下面「配色系统」）

样式和逻辑完全复用，不用重复写。

---

## 数据字段说明

### `cat`（引脚分类，决定封装图配色）

| 值 | 含义 | 颜色 |
|---|---|---|
| `GPIO` | 普通可编程 IO | 绿 |
| `SPEC` | 特殊功能脚（OSC、BOOT、NRST、VBAT、EN 等） | 棕 |
| `PWR` | 电源与地 | 灰 |
| `DBG` | 调试口（SWD/JTAG） | 紫 |
| `NC` | 不可用 / 被内置 Flash、PSRAM 占用（图上加删除线） | 灰褐 |

### `af` 的键名

决定表格里功能名用什么颜色。已支持：`UART`、`SPI`、`I2C`、`CAN`、`USB`、`TIM`、`ADC`、`DAC`、`COMP`、`SAI`、`DBG`、`SYS`、`REMAP`、`DMA`、`FSMC`、`ETH`、`DCMI`、`SDIO`、`RTC`、`TOUCH`、`CLK`、`FLASH`、`STRAP`。

写其它名字也能正常显示，只是用默认颜色；筛选按钮会自动从数据里收集实际出现的类别，不需要手工维护。

### `layout` 与 `epad`（非四边均分封装才需要）

STM32 的 LQFP 四边引脚数基本均分，程序会自动推算。但像 ESP32-S3-WROOM-1 这种模组（左边 14、底边 13、右边 13、顶边 0）或 QFN32，就必须显式给出真实布局：

```js
layout: {
  left:   [1, 2, 3, 4, 5, 6, 7, 8],        // 左侧自上而下
  bottom: [9, 10, 11, 12, 13, 14, 15, 16], // 底边自左向右
  right:  [24, 23, 22, 21, 20, 19, 18, 17],// 右侧自下而上
  top:    [32, 31, 30, 29, 28, 27, 26, 25] // 顶边自右向左
},
epad: {n: 33, nm: "GND", desc: "底部散热焊盘 · 接地"},
```

`epad` 是底部散热焊盘，会单独画在芯片本体中央，点击同样能看详情。

### `links`（手册与购买入口）

ST 芯片用 `stProduct` / `stDatasheet`，其它厂商用 `vendor` + `vendorProduct` + `vendorDatasheet`（`vendor` 同时决定页面上显示「乐鑫 Espressif」还是「ST 官方」）：

```js
links: {
  vendor: "乐鑫 Espressif",
  vendorProduct:   "https://www.espressif.com/en/products/socs/esp32-c3",
  vendorDatasheet: "https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf",
  lcsc:            "https://item.szlcsc.com/3060870.html"
}
```

### `ty`（引脚类型）

按数据手册的 Type + I/O structure 两列合并书写，例如：

- `I/O` — 普通双向
- `I/O FT` — 5V 容限
- `I/O TTa` — 3.3V 容限且带模拟功能
- `I` / `O` — 仅输入 / 仅输出
- `S` — 电源

**这一列务必按手册填准**，它是判断能不能直接接 5V 器件的关键依据。

---

## 设计约定

- **配色**：分两层。主页是白/米色中性底 + 墨灰强调色；每个系列用自己的强调色（STM32 青绿、ESP 咖啡黄），靠 `<html data-series="...">` 切换。正文对比度按 WCAG AA 校核（浅色与深色两套主题共 14 个页面组合全部达标）。引脚与外设的类别色都压过暗，保证小字号也读得清。
- **响应式**：320px–1400px 无横向溢出、无文字截断；封装图与表格在窄屏内可横向滚动，不撑破页面。
- **数据驱动**：所有芯片内容都在 `data/*.js`，页面模板不含硬编码信息。

### 配色系统

配色由两层变量叠加决定：

| 层 | 变量 | 由谁决定 |
|---|---|---|
| 表层 | `--bg` `--surface` `--txt` `--line` | 系列（`data-series`） |
| 强调色 | `--accent` `--accent-ink` `--accent-soft` `--accent-line` | 系列（`data-series`） |
| 明暗 | 上述全部 | 主题（`data-theme="dark"`） |

切换系列配色只需在页面根元素上加属性：

```html
<!-- 主页：不写 data-series，用中性墨灰 -->
<html lang="zh-CN">

<!-- STM32 系列页：青绿 -->
<html lang="zh-CN" data-series="stm32">

<!-- ESP32 系列页：咖啡黄 -->
<html lang="zh-CN" data-series="esp">
```

已有的三套配色：

| 系列 | 底色 | 强调色 | 说明 |
|---|---|---|---|
| 主页（默认） | `#f7f6f2` 白米 | `#5c6672` 墨灰 | 中性，不抢系列色 |
| `stm32` | `#f0f2ed` 淡绿 | `#3f7266` 青绿 | STM32 系列页与芯片页 |
| `esp` | `#faf7ef` 米黄 | `#8a6a30` 咖啡黄 | ESP32 系列页与芯片页 |

单张卡片想局部套用某个系列色，加 `.palette-green` / `.palette-coffee` / `.palette-slate` 工具类即可（主页的系列卡片就是这么给卡片顶端色条和「配色」胶囊上色的）。

### 新增一个系列配色

在 `assets/style.css` 的「④ ESP 系列」附近照抄一段，改三个选择器即可：

```css
[data-series="你的系列"] { /* 浅色表层 + 强调色 */ }
[data-theme="dark"][data-series="你的系列"] { /* 深色覆盖 */ }
.palette-你的系列 { /* 局部工具类，可选 */ }
```

然后页面根元素加 `data-series="你的系列"`。

---

## 数据可信度

**STM32（3 颗）**：引脚定义、引脚类型、复用功能已与 ST 官方 PDF 数据手册逐条比对，共修正 19 处错误。详细比对记录见 [`stm32/校准报告.md`](stm32/校准报告.md)。

**ESP32（2 款）**：引脚定义、类型、默认功能、复用功能、strapping 脚、内置 Flash / PSRAM 占用情况全部取自乐鑫官方手册，引脚四边布局按手册封装图逐一核对（不是四等分推算）：

| 型号 | 依据手册 | 引脚 | 封装 |
|---|---|---|---|
| ESP32-S3-WROOM-1-N16R8 | ESP32-S3-WROOM-1 Datasheet v1.8 + ESP32-S3 Series Datasheet v2.2 | 41（含 EPAD） | SMD-41，1.27 mm 间距 |
| ESP32-C3FH4 | ESP32-C3 Series Datasheet v2.4 | 33（含 GND 焊盘） | QFN32，5×5 mm，0.5 mm 间距 |

**尚未覆盖**：STM32 复用功能的 AF0–AF15 编号、电气参数（绝对最大额定值、灌拉电流）、勘误表（Errata）；ESP32 的 GPIO Matrix 任意映射关系（手册中标注可映射到任意 GPIO 的外设未逐一列举）、IO MUX 的 F0–F4 功能编号。做正式设计时请以手册原件为准。

---

## 常见问题

**Q：为什么某颗芯片的某个外设引脚比手册少？**
A：已按当前封装剔除未引出的引脚。例如 STM32 LQFP100 封装没有 PF/PG 端口，相关复用功能不会列出；页面里的说明文字会标注"属 LQFP144+ 封装"。ESP32-S3-WROOM-1-N16R8 内置 8 MB 八线 PSRAM，IO35/IO36/IO37 被占用，页面上标为「不可用」并加删除线。

**Q：搜索不到某个功能？**
A：搜索是基于表格文本的模糊匹配，可以试外设名（`usart1`）、引脚名（`PA9`、`IO4`）、引脚号（`42`）或功能片段（`rmii`、`adc2`）。也确认一下该功能在当前封装上是否真的引出。

**Q：颜色看着不对 / 想换配色？**
A：所有颜色都是 `assets/style.css` 顶部的 CSS 变量（设计令牌）。表层色与强调色按系列分组（`[data-series="..."]`），深色在 `[data-theme="dark"]` 块里覆盖。改对应系列那一组即可，详见上面「配色系统」。

**Q：能加别的厂商芯片吗？**
A：可以。数据结构是通用的，按上面「新增一个系列」的步骤操作即可，`cat` / `af` 键名沿用现有约定就能直接复用配色。ESP32 就是照这个流程接进来的第二个系列。

**Q：为什么不用框架 / 打包工具？**
A：这类速查表的使用场景是「离线打开、随手一查」。纯静态文件意味着可以拷到 U 盘、断网环境、手机上直接打开，也不用担心几年后构建工具链装不上。

---

## 许可

引脚数据整理自各厂商公开的官方数据手册，仅供设计参考，正式设计请以手册原件为准。

代码与页面样式可自由使用、修改、分发。如果你希望显式声明一个开源许可（如 MIT），在仓库根目录添加 `LICENSE` 文件即可。
