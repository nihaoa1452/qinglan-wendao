# 素材放置说明

当前美术为 **2026-11-11 迭代版**。完整提示词、生成参数和复现流程见 [docs/ART_PASS_2026.md](../../docs/ART_PASS_2026.md)，资源 ID 映射见 [docs/ASSET_MAP.md](../../docs/ASSET_MAP.md)。

- 33 张卡牌插画：`cards/<cardId>.jpg`
- 10 个敌人战斗场景：`enemies/<enemyId>.jpg`
- 玩家战斗立绘：`hero/player-combat.jpg`
- 标题背景 / 山道卷轴 / 界面底层：`bg/title.jpg`、`bg/map.jpg`、`bg/sect.jpg`
- 闭关 / 坊市场景：`scenes/rest.jpg`、`scenes/shop.jpg`
- 7 个遗物 / 丹药图标：`items/<itemId>.png`
- 标题字：`title-qinglan.png`
- 11 张事件图、2 张结局图：`events/`、`endings/`

```text
public/assets/
  cards/           33 张 512×512 JPG
  enemies/         10 张 1280×720 JPG
  hero/            player-combat.jpg
  bg/
    title.jpg      1600×900
    map.jpg        1024×1536
    sect.jpg       1600×900（界面底层背景）
  scenes/
    rest.jpg       1280×720
    shop.jpg       1280×720
  items/           7 张 512×512 透明 PNG
  events/          11 张 960×540 JPG
  endings/         win.jpg  lose.jpg
  title-qinglan.png
```

## 规格

- 卡图：**512×512 JPG**。方形 1:1，主体居中，边缘留 8% 安全区；UI 中放进暗色画窗，使用 `object-fit: cover`。
- 敌人图：**1280×720 JPG**。横幅 16:9，主体偏左/居中，头部与上半身在画面中央，右侧留出意图文字的位置；UI 裁成宽幅。
- 玩家图：**1280×720 JPG**，人物面向左侧（敌人方向）。
- 背景：标题 1600×900；山道 1024×1536；深色、低对比、中央或中部留出可放 UI 的雾带。
- 场景：1280×720 JPG；闭关/坊市顶部横幅。
- 道具：**512×512 透明 PNG**；主体占 55%，边缘留 15%，缩到 48px 仍可读。
- 标题字：透明 PNG，裁到文字区域，四周约 24px 留白。
- 事件：960×540 JPG；结局：1280×720 JPG。

## 换图约定

1. 优先保持文件名和 id 不变；换同名文件即可生效。
2. 若改文件名，需要同步 `src/sts/assets.ts`、`src/sts/data.ts` 和 `docs/ASSET_MAP.md`。
3. 新增卡牌时，给卡图命名为 `cards/<cardId>.jpg`，并把 id 加进 `CARD_ART_IDS`。
4. 新增敌人时，给场景命名为 `enemies/<enemyId>.jpg`；新增道具时，把 id 加进 `ITEM_ART_IDS`。
5. 删除素材前先搜索代码引用，确认没有页面或数据表还在使用。

## 生成与导出

游点灵资源中心支持 `POST /api/res/generate-2-d-text-to-image`，模型用 `seedream_5_0_pro`。仓库里的 `scripts/art/artgen.mjs` 会批量提交任务、轮询、下载，并把资源 id 写入 `manifest.json`；`scripts/art/process-art.py` 负责把原图处理成上面的规格。具体见 [docs/ART_PASS_2026.md](../../docs/ART_PASS_2026.md)。
