# 青岚问道录 · 素材映射（2026-11-11 美术迭代版）

本文件记录 `public/assets/` 中实际使用的图片、游点灵资源 ID 与文件路径。原始导出文件与 `manifest.json` 在 `shots/`（被 git 忽略，仅本地保留）。

> 2026-11-11 起，33 张卡牌、10 个敌人、玩家战斗图、标题/山道背景、闭关/坊市场景、7 个道具图标、5 张传承横幅和标题字全部由游点灵 Seedream 5.0 Pro 重做。旧 29 张宗门经营卡图保留在 `cards/*.png`，不再被当前卡牌引用。

## 卡牌（33）

| 卡牌 id | 名称 | 费用 | 类型 | 稀有度 | 资源 id | 输出 |
| --- | --- | --- | --- | --- | --- | --- |
| `qingfeng` | 青锋斩 | 1 | attack | starter | `1000041405` | `cards/qingfeng.jpg` |
| `ningqi` | 凝气盾 | 1 | skill | starter | `1000041406` | `cards/ningqi.jpg` |
| `zhenyue` | 镇岳剑 | 2 | attack | starter | `1000041407` | `cards/zhenyue.jpg` |
| `lianzhan` | 连斩 | 1 | attack | common | `1000041408` | `cards/lianzhan.jpg` |
| `gongfeng` | 罡风 | 1 | attack | common | `1000041409` | `cards/gongfeng.jpg` |
| `huifeng` | 回风诀 | 1 | skill | common | `1000041410` | `cards/huifeng.jpg` |
| `jianyi` | 剑意 | 1 | power | uncommon | `1000041418` | `cards/jianyi.jpg` |
| `jinzhong` | 金钟罩 | 2 | skill | common | `1000041419` | `cards/jinzhong.jpg` |
| `yaoquan` | 药泉 | 1 | skill | common | `1000041420` | `cards/yaoquan.jpg` |
| `wulei` | 五雷符 | 2 | attack | uncommon | `1000041421` | `cards/wulei.jpg` |
| `wanjian` | 万剑归宗 | 3 | attack | rare | `1000041422` | `cards/wanjian.jpg` |
| `taixu` | 太虚剑典 | 2 | power | rare | `1000041423` | `cards/taixu.jpg` |
| `yujian` | 御剑术 | 1 | attack | common | `1000041424` | `cards/yujian.jpg` |
| `lingxi` | 灵息 | 0 | skill | uncommon | `1000041425` | `cards/lingxi.jpg` |
| `danhuo` | 丹火 | 1 | attack | common | `1000041426` | `cards/danhuo.jpg` |
| `jianzhen` | 青岚剑阵 | 2 | skill | uncommon | `1000041427` | `cards/jianzhen.jpg` |
| `tayun` | 踏云步 | 1 | skill | common | `1000041428` | `cards/tayun.jpg` |
| `juling` | 聚灵 | 0 | skill | uncommon | `1000041429` | `cards/juling.jpg` |
| `xuezhan` | 血战 | 1 | attack | uncommon | `1000041431` | `cards/xuezhan.jpg` |
| `guiyuan` | 归元 | 2 | skill | rare | `1000041432` | `cards/guiyuan.jpg` |
| `hushanzhen` | 护山大阵 | 2 | skill | uncommon | `1000041433` | `cards/hushanzhen.jpg` |
| `zhuifeng` | 追风剑 | 1 | attack | uncommon | `1000041434` | `cards/zhuifeng.jpg` |
| `duwu` | 毒雾 | 1 | skill | uncommon | `1000041435` | `cards/duwu.jpg` |
| `shigu` | 蚀骨 | 2 | attack | rare | `1000041436` | `cards/shigu.jpg` |
| `shenfa` | 身法 | 1 | power | uncommon | `1000041437` | `cards/shenfa.jpg` |
| `ningshen` | 凝神 | 1 | skill | common | `1000041438` | `cards/ningshen.jpg` |
| `jianyu` | 剑雨 | 2 | attack | uncommon | `1000041439` | `cards/jianyu.jpg` |
| `huichun` | 回春 | 1 | skill | common | `1000041440` | `cards/huichun.jpg` |
| `taiyi` | 太乙剑 | 3 | attack | rare | `1000041447` | `cards/taiyi.jpg` |
| `qingxin` | 清心诀 | 1 | skill | common | `1000041450` | `cards/qingxin.jpg` |
| `yinxue` | 饮血 | 1 | attack | uncommon | `1000041451` | `cards/yinxue.jpg` |
| `shouyi` | 守一 | 2 | skill | rare | `1000041452` | `cards/shouyi.jpg` |
| `fentian` | 焚天 | 3 | attack | rare | `1000041453` | `cards/fentian.jpg` |

## 敌人（10）

| 敌人 id | 名称 | 资源 id | 输出 |
| --- | --- | --- | --- |
| `shanyao` | 山魈 | `1000041461` | `enemies/shanyao.jpg` |
| `sanxiu` | 散修 | `1000041462` | `enemies/sanxiu.jpg` |
| `yaoshou` | 妖兽 | `1000041463` | `enemies/yaoshou.jpg` |
| `moxiu` | 魔修 | `1000041464` | `enemies/moxiu.jpg` |
| `yaowang` | 妖王 | `1000041465` | `enemies/yaowang.jpg` |
| `huyao` | 狐妖 | `1000041466` | `enemies/huyao.jpg` |
| `shikui` | 尸傀 | `1000041468` | `enemies/shikui.jpg` |
| `jianling` | 剑灵 | `1000041469` | `enemies/jianling.jpg` |
| `xuexiu` | 血修 | `1000041470` | `enemies/xuexiu.jpg` |
| `moyan` | 魔焰妖王 | `1000041471` | `enemies/moyan.jpg` |

## 玩家 / 背景 / 场景

| 用途 | 资源 id | 输出 |
| --- | --- | --- |
| 玩家战斗立绘 | `1000041472` | `hero/player-combat.jpg` |
| 标题 / 传承 / 暂停背景 | `1000041473` | `bg/title.jpg` |
| 山道卷轴 / 地图背景 | `1000041476` | `bg/map.jpg` |
| 闭关场景 | `1000041477` | `scenes/rest.jpg` |
| 坊市场景 | `1000041478` | `scenes/shop.jpg` |

## 遗物 / 丹药图标（7）

| 道具 id | 名称 | 资源 id | 输出 |
| --- | --- | --- | --- |
| `relic-seal` | 青岚掌门印 | `1000041479` | `items/relic-seal.png` |
| `relic-gourd` | 青玉葫芦 | `1000041480` | `items/relic-gourd.png` |
| `relic-swordheart` | 剑心通明 | `1000041481` | `items/relic-swordheart.png` |
| `relic-jade` | 聚灵玉佩 | `1000041482` | `items/relic-jade.png` |
| `potion-healing` | 回春丹 | `1000041483` | `items/potion-healing.png` |
| `potion-focus` | 聚灵散 | `1000041484` | `items/potion-focus.png` |
| `potion-rage` | 破障丹 | `1000041485` | `items/potion-rage.png` |

## 传承横幅（5）

| 传承 id | 名称 | 资源 id | 输出 |
| --- | --- | --- | --- |
| `meta-zhuifeng` | 追风剑谱 | `1000041771` | `meta/meta-zhuifeng.jpg` |
| `meta-qingxin` | 清心诀 | `1000041773` | `meta/meta-qingxin.jpg` |
| `meta-swordheart` | 剑心通明 | `1000041774` | `meta/meta-swordheart.jpg` |
| `meta-juling` | 聚灵散 | `1000041775` | `meta/meta-juling.jpg` |
| `meta-xueqi` | 气血淬炼 | `1000041776` | `meta/meta-xueqi.jpg` |

## 标题字

| 用途 | 资源 id | 输出 |
| --- | --- | --- |
| 游戏标题「青岚问道录」 | `1000041392` | `title-qinglan.png`（透明 PNG，986×402） |

## 事件（11，沿用 2026-11-10 素材）

| 事件 id | 名称 | 资源 id | 输出 |
| --- | --- | --- | --- |
| `yaoshou` | 妖兽袭山 | `1000040964` | `events/yaoshou.jpg` |
| `lingyu` | 灵雨普降 | `1000040966` | `events/lingyu.jpg` |
| `sanxiu` | 散修来投 | `1000040967` | `events/sanxiu.jpg` |
| `shuijuan` | 仙盟征税 | `1000040968` | `events/shuijuan.jpg` |
| `tiaoxin` | 邻宗挑衅 | `1000040969` | `events/tiaoxin.jpg` |
| `mijing` | 秘境现世 | `1000040970` | `events/mijing.jpg` |
| `xiangrui` | 紫气东来 | `1000040971` | `events/xiangrui.jpg` |
| `wenyi` | 时疫 | `1000040990` | `events/wenyi.jpg` |
| `moxiu` | 魔修夜袭 | `1000040973` | `events/moxiu.jpg` |
| `wudao` | 溪畔顿悟 | `1000040991` | `events/wudao.jpg` |
| `shangdui` | 商队借宿 | `1000040988` | `events/shangdui.jpg` |

## 结局 / 旧背景（沿用）

| 用途 | 资源 id | 输出 |
| --- | --- | --- |
| 胜利结局 | `1000040976` | `endings/win.jpg` |
| 失败结局 | `1000040989` | `endings/lose.jpg` |
| 旧宗门背景 | `1000040961` | `bg-sect.jpg`（运行界面底层背景） |

## 处理约定

- 卡图：1024×1024 原图 → 512×512 JPG；加暗角、轻微对比/饱和调整。
- 敌人：1280×720 JPG；加暗角，UI 中按 `background-size: cover` 裁切。
- 道具：透明 PNG；裁透明边后补成 512×512。
- 传承横幅：1536×512 原图 → 1200×400 JPG（3:1）；加暗角，UI 中按 3:1 画窗完整显示。
- 改名或替换时，同步 `src/game/assets.ts` 和本表；只要文件名不变，UI 无需改动。

完整提示词与复现流程见 [ART_PASS_2026.md](ART_PASS_2026.md)。
