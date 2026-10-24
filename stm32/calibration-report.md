# STM32 引脚数据校准报告

校准日期：2026-10-24
校准方式：用脚本从 ST 官方 PDF 数据手册中提取引脚定义表，与站内 `stm32/data/*.js` 逐条比对。

## 一、核对基准

| 芯片 | 官方手册 | 版本 | 核对表 | 页码范围 |
|---|---|---|---|---|
| STM32F103C8T6 | DS5319 | **Rev 20** | Table 5 引脚定义 | P28–33 |
| STM32F407VET6 | DS8626 | **Rev 12** | Table 7 引脚与球定义 | P49–61 |
| STM32G431RBT6 | DS12589 | Rev 6 | Table 12 引脚定义 | P51–60 |

手册均从 `st.com/resource/en/datasheet/` 直接下载（PDF 原件已留存）。
比对方法：用 PyMuPDF 按表格单元格边界提取文字（避免 PDF 断字把 `FSMC_CLE` 拆成 `FSMC_CLE /`、把引脚号 100 拆成 `10\n0`），三份表分别得到 48 / 100 / 64 行，编号连续、无重复。

## 二、核对结果总览

| 芯片 | 引脚数 | 引脚名 | 引脚类型 | 复用功能 | 结论 |
|---|---|---|---|---|---|
| F103C8T6 | 48 | 一致（1 处有意保留） | **已修正 6 处** | 一致 | 通过 |
| F407VET6 | 100 | 一致 | **已修正 6 处** | **已修正 7 处** | 通过 |
| G431RBT6 | 64 | 一致 | 一致 | 一致 | 通过 |

## 三、发现并修正的错误

### 3.1 功能性错误（会影响选型判断）

**G431RBT6 — ADC 采样率写错（重要）**
- 原值：`2 × 12bit / 5 Msps`
- 官方：`They offer two fast 12-bit ADCs (4 Msps)`、`4 Msps maximum conversion rate with full resolution`
- 已改为 `4 Msps`。全文共 4 处提及（spec 表、简介、外设速查、设计要点）均已同步修正。
- 注：G431 在 6-bit 分辨率下最高可到 6.66 Msps，但满分辨率是 4 Msps，写 5 Msps 属误标。

**手册版本号过期**
- F103：`DS5319 Rev 18` → **Rev 20**
- F407：`DS8626 Rev 10` → **Rev 12**
- 已同步更新数据文件头部注释、`source` 字段与页面显示。

### 3.2 引脚类型错误（I/O 结构与 5V 容限）

**F103C8T6（6 处）**

| 引脚 | 原值 | 官方 | 说明 |
|---|---|---|---|
| #2 PC13 | I/O FT | **I/O** | PC13–PC15 经电源开关供电，**不支持 5V** |
| #3 PC14 | I/O FT | **I/O** | 同上 |
| #4 PC15 | I/O FT | **I/O** | 同上 |
| #5 PD0 | I/O FT | **I** | 复位后为 OSC_IN，仅输入 |
| #6 PD1 | I/O FT | **O** | 复位后为 OSC_OUT，仅输出 |
| #7 NRST | I | **I/O** | 双向复位脚 |

这三处 `FT` 误标风险最大：按原数据把 PC13–PC15 直接接 5V 逻辑会超限。

**F407VET6（6 处）**

| 引脚 | 原值 | 官方 |
|---|---|---|
| #14 NRST | I | **I/O RST** |
| #29 PA4 | I/O | **I/O TTa** |
| #30 PA5 | I/O | **I/O TTa** |
| #31 PA6 | I/O | **I/O FT** |
| #32 PA7 | I/O | **I/O FT** |
| #94 BOOT0 | I | **I B**（B = 专用 BOOT0，附 VPP） |

PA6/PA7 漏标 `FT` 会导致误以为不能接 5V；PA4/PA5 漏标 `TTa` 会误以为能接 5V（实际是 3.3V 模拟脚）。

### 3.3 复用功能命名（F407，7 处）

以太网 RMII 备用功能官方写法带 `ETH_` 前缀，原数据省略：

| 引脚 | 原值 | 官方 |
|---|---|---|
| #24 PA1 | RMII_REF_CLK | **ETH_RMII_REF_CLK** |
| #32 PA7 | RMII_CRS_DV | **ETH_RMII_CRS_DV** |
| #33 PC4 | RMII_RXD0 | **ETH_RMII_RXD0** |
| #34 PC5 | RMII_RXD1 | **ETH_RMII_RXD1** |
| #48 PB11 | RMII_TX_EN | **ETH_RMII_TX_EN** |
| #51 PB12 | RMII_TXD0 | **ETH_RMII_TXD0** |
| #52 PB13 | RMII_TXD1 | **ETH_RMII_TXD1** |

已按官方改为完整写法（保留 MII 与 RMII 两种并存），搜索 `RMII` 仍能命中。

### 3.4 补充缺失功能（F407）

| 引脚 | 补充内容 | 官方原文 |
|---|---|---|
| #58 PD11 | 补 `FSMC_CLE` | `FSMC_CLE / FSMC_A16` |
| #59 PD12 | 补 `FSMC_ALE` | `FSMC_ALE / FSMC_A17` |
| #88 PD7 | 修正 `NCE2` → `FSMC_NCE2` | `FSMC_NE1 / FSMC_NCE2` |
| #23–#26, #31, #32 | `ADC1_INn` → `ADC123_INn` | 三个 ADC 共用通道 |
| #29 PA4 | `DAC1_OUT` → `DAC_OUT1`，补 `ADC12_IN4` | `ADC12_IN4 / DAC_OUT1` |
| #30 PA5 | `DAC2_OUT` → `DAC_OUT2`，补 `ADC12_IN5` | `ADC12_IN5 / DAC_OUT2` |

DAC 命名尤其要注意：F4 的 DAC 通道叫 `DAC_OUT1/2`，而 G4 才叫 `DAC1_OUT1/2`，两者不能混用。

### 3.5 GPIO 数量口径

三颗芯片的 GPIO 数经核对**数值正确**，但原表述没说明统计口径，容易与手册对不上。已补充说明：

| 芯片 | GPIO | 口径 |
|---|---|---|
| F103C8T6 | 37 | LQFP48 共 36 个 I/O 型引脚 + NRST |
| F407VET6 | 82 | LQFP100 共 83 个 I/O 型引脚 + NRST |
| G431RBT6 | 51 | LQFP64 共 52 个 I/O，含 NRST |

手册概述页的「Up to 80 / 140 / 86 GPIOs」是全系列上限（对应最大封装），不是本封装数值。

## 四、经核实为「写法差异」而非错误（保留）

| 芯片 | 引脚 | 本地 | 官方 | 判定 |
|---|---|---|---|---|
| F103 | #5 #6 | PD0 / PD1 | OSC_IN / OSC_OUT | **有意保留**。手册脚注 7 说明 LQFP48 的 5/6 脚复位后是晶振脚，PD0/PD1 需软件重映射；保留 PD0/PD1 便于按名检索，已在注意事项说明 |
| F103 | #33 PA12 | USB_DP | USBDP | 同义 |
| F103 | #39 PB3 | JTDO / TRACESWO | PB3 TRACESWO | 同义 |
| F407 | #72 #76 | JTMS / SWDIO | JTMS-SWDIO | 分隔符差异 |
| G431 | #7 | I/O NRST | I/O NRST (4) | `(4)` 是手册脚注号 |
| G431 | #44 | I/O FT_da | I/O FT_d a | 手册排版断字 |
| G431 | #61 | PB8-BOOT0 | PB8-BOOT0 | 一致（BOOT0 已含在引脚名） |
| G431 | #17 | OPAMP1_VINM / OPAMP1_VINP | 同左 | 已对齐 |

## 五、校验后自动检查

- 引脚数、编号连续性、重复号：三颗芯片全部通过
- 引脚名与官方逐条对照：通过
- 引脚类型（Type + I/O structure 合并）逐条对照：**0 处不一致**
- 复用功能集合对照：0 处缺失
- 页面渲染：引脚图/总表/外设速查/注意事项全部正常，无 JS 错误
- 响应式：360–1400px 六档无溢出、无文字截断
- 对比度：浅色与深色两套主题、8 个页面，全部达到 WCAG AA（0 处不达标）

## 六、尚未覆盖的内容

以下未做逐条比对，仅供参考：

- **复用功能编号（AF0–AF15）**：手册 Table 13（G4）/ Table 9（F4）给出每个复用功能对应的 AF 编号，当前页面只列功能名、未标 AF 号。若需要配 CubeMX 时核对，这部分值得补。
- **电气参数**：绝对最大额定值、I/O 灌拉电流、ADC 精度等未纳入。
- **勘误表（Errata）**：未核对，实际设计建议查对应型号的 ES 文档。
