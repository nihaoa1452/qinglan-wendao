> English backup for Midjourney / Stable Diffusion / other tools. 游点灵请用 `ART_BRIEF.md` 中文版。

# 青岚宗 · 美术提示词与制作清单（v0.2）
> 所有卡牌共用同一个风格后缀；每条 prompt 已包含完整风格，直接整段复制即可。
> 先做 **Batch 1** 锁定风格，再批量做 29 张卡面，避免返工。

## 0. 统一风格锁（先读）
- **气质**：水墨 / 青绿山水，仙侠，克制、清冷、有旧纸与香火气。
- **主色**：深墨绿 `#0c1411`、旧金 `#d9b96c`、纸色 `#f3ead6`、印章红 `#8d3029`。
- **光线**：柔和侧光 / 晨雾 / 月光；避免霓虹、强饱和、现代物件。
- **构图**：主体居中，边缘留 8% 安全区；卡面在 48–66px 缩略图下仍能读出轮廓。
- **禁止**：文字、字母、边框、水印、Logo、UI、照片写实、西方奇幻、过曝。
- **一致性**：同一模型版本、同一 seed / style reference；第一张满意的卡作为后面所有卡的风格参考。不要逐张换“anime / 3D / 写实”风格。

> UI 图标与卡背暂不需要：当前资源用汉字/符号展示，卡背也不出现在界面上；以后要做图形化图标再单独补。

### 统一负面词（卡牌 / 背景 / 事件 / 结局都适用）
```text
text, Chinese characters, calligraphy, letters, watermark, logo, signature, frame, border, card frame, UI elements, modern objects, neon, oversaturated, photorealistic, western fantasy, anime, cartoon, 3D render, extra limbs, deformed hands, busy background, clutter, cropped subject, low resolution
```
> 标题图不要用这段负面词（标题需要文字），见第 3 节。

### 统一风格后缀（已写进下面每条卡牌 prompt）
```text
Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

### 事件/结局风格后缀（已写进事件/结局 prompt）
```text
Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

## 1. 卡牌（29 张）
> 512×512 PNG，透明背景；如果工具只能出纯色底，用纯 `#0c1411`，告诉我，我来处理。
>
> 卡图会同时用于手牌、坊市、八景三处缩略图。接入先采用“纸卡 + 方形小画”；如果你想改成“上半幅画 / 下半文字”，同一张方形图也能裁切。

### Batch 1（P0，先做这 8 张 + 背景 + 标题）

#### `caishi.png` · 采灵石
> 行动 · 常见。缩略图重点：清晨山涧，弟子俯身拾取发光的青蓝灵石，竹篮、溪水与薄雾

```text
A young xianxia disciple crouching by a clear mountain stream at dawn, picking glowing blue-green spirit stones into a bamboo basket, wet stones and pine shadows. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `zhaoshou.png` · 招收弟子
> 行动 · 常见。缩略图重点：青岚宗山门前，几名年轻求道者拱手行礼，掌门背影与古松

```text
A group of young villagers bowing at the stone gate of a mountain sect, an old pine and fluttering banners, the master's silhouette in the doorway. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `jiangdao.png` · 讲道
> 行动 · 常见。缩略图重点：古松下掌门盘坐讲道，弟子围坐，空中浮起淡金篆文与清风

```text
An elderly sect master seated in meditation under an ancient pine, teaching a small circle of disciples, faint golden seal-script light floating in the air. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `lixian.png` · 下山历练
> 行动 · 常见。缩略图重点：少年弟子负剑下山，石阶蜿蜒入云，回望山门

```text
A young swordsman with a sword on his back descending a long stone stairway from a mountain sect, looking back at the gate, mist and peaks. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `shilian.png` · 弟子试炼
> 行动 · 常见。缩略图重点：演武石台上弟子比试，木剑与石柱，旁观长老

```text
Two young disciples sparring with wooden swords on a stone training platform, stone pillars and watching elders, fallen leaves. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `lingtian.png` · 灵田
> 设施 · 常见。缩略图重点：层叠灵田，稻穗泛青光，晨雾与远山

```text
Terraced spirit-rice fields glowing with faint jade light at dawn, a narrow stone path, wooden fence and distant ink mountains. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `cangjingge.png` · 藏经阁
> 设施 · 少见。缩略图重点：多层藏经阁，飞檐与万卷经书，窗前灯影

```text
A tall multi-story scripture pavilion with flying eaves, stacks of scrolls visible through latticed windows, warm lantern light, pine branches. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `yanwuchang.png` · 演武场
> 设施 · 常见。缩略图重点：山间演武场，弟子列阵练剑，旗帜与落叶

```text
A mountain training ground with rows of disciples practicing sword forms, banners, falling leaves and distant peaks. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

> Batch 1 完整清单：`bg-sect.png`、`title-qinglan.png`、`caishi`、`zhaoshou`、`jiangdao`、`lixian`、`shilian`、`lingtian`、`cangjingge`、`yanwuchang`。

### Batch 2（P1，15 张坊市行动）

#### `bushi.png` · 布施
> 行动 · 常见。缩略图重点：宗门弟子在山下村落施粥赠药，村民拱手，暖色灯笼

```text
Sect disciples distributing rice and medicine to villagers at the foot of the mountain, paper lanterns, bowed villagers, warm dusk. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `mijing.png` · 秘境探险
> 行动 · 常见。缩略图重点：幽深古洞，石门与发光藤蔓，探险弟子举灯

```text
A deep ancient cave with a stone door, glowing vines and floating motes, a disciple raising an oil lamp. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `kuangmai.png` · 开采灵矿
> 行动 · 常见。缩略图重点：灵矿洞中，弟子凿取青蓝晶矿，矿车与尘光

```text
Disciples mining blue-green crystal ore in a dark spirit mine, pickaxes, wooden cart and dusty shafts of light. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `shanyaoshi.png` · 山下药市
> 行动 · 常见。缩略图重点：山下药市，草药摊与灯笼，药农与弟子交易

```text
A lively herb market at the foot of the mountain, baskets of medicinal plants, lanterns, a herbalist and a sect disciple bargaining. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `mengui.png` · 门规整肃
> 行动 · 常见。缩略图重点：宗规堂内，长老执戒尺，弟子列队肃立，匾额阴影

```text
A stern elder holding a discipline ruler in the sect hall, rows of disciples standing straight, shadowed plaque and incense smoke. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `keqing.png` · 客卿讲武
> 行动 · 常见。缩略图重点：客卿剑客在演武场演示剑势，剑光如虹，弟子惊叹

```text
A guest swordsman demonstrating a brilliant sword technique in the training ground, arc of light, astonished disciples. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `xunshan.png` · 巡山收租
> 行动 · 常见。缩略图重点：巡山弟子持账簿与剑，在山脚田庄收租，农夫拱手

```text
A sect disciple with a ledger and sword collecting rent at a mountain-foot farm, farmers bowing, rice fields and low houses. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `lundao.png` · 论道大会
> 行动 · 少见。缩略图重点：论道大会，群修围坐高台，经卷与茶烟，远山

```text
A great dao discussion in a mountain hall, cultivators seated around a high platform, scrolls, tea smoke and distant peaks. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `guangna.png` · 广纳门徒
> 行动 · 少见。缩略图重点：山门长阶，求道者排成长队，招徒旗幡

```text
A long line of applicants climbing the stone steps to the sect gate, recruitment banners, morning mist. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `tianji.png` · 天机推演
> 行动 · 少见。缩略图重点：天机阁内，星盘与浑天仪，推演者指尖星光

```text
A diviner in a star observatory, bronze armillary sphere and star chart, faint starlight at the fingertips. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `kaitan.png` · 开坛授徒
> 行动 · 少见。缩略图重点：法坛高筑，掌门开坛授徒，香火与经幡，弟子叩拜

```text
An outdoor ordination altar with incense and sutra banners, a master blessing a kneeling disciple, gathered crowd. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `mijingxunbao.png` · 秘境寻宝
> 行动 · 少见。缩略图重点：秘境废墟，宝箱半开，金光与古老守卫石像

```text
A treasure chest half-open in ancient ruins, golden light, weathered guardian statue and glowing vines. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `jingshi.png` · 静室闭关
> 行动 · 少见。缩略图重点：静室闭关，一名修士盘坐，烛火与符纸，四壁幽暗

```text
A solitary cultivator meditating in a dark sealed room, one candle, talisman papers and a thin wisp of incense. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `zushi.png` · 祖师显灵
> 行动 · 稀有。缩略图重点：祖师画像显灵，金色法相笼罩祠堂，弟子跪拜

```text
The ancestral portrait in the sect shrine glowing with a golden dharma image, a disciple kneeling below, incense. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `wuxing.png` · 五行聚宝
> 行动 · 稀有。缩略图重点：五行法阵，金木水火土五色光团环绕，铜钱与灵玉

```text
A five-element formation with five colored orbs of metal, wood, water, fire and earth orbiting a central jade disc, coins and crystals. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

### Batch 3（P2，6 张剩余设施）

#### `julingzhen.png` · 聚灵阵
> 设施 · 少见。缩略图重点：山巅聚灵阵，石柱与符文，灵气汇成光柱

```text
A spirit-gathering formation on a mountain summit, stone pillars carved with runes, a rising column of jade-green light. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `wudaoya.png` · 悟道崖
> 设施 · 稀有。缩略图重点：悬崖悟道石，修士独立云海，衣袂翻飞

```text
A lone cultivator standing on a cliff-edge meditation stone above a sea of clouds, robes flowing, distant peaks. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `danfang.png` · 丹房
> 设施 · 少见。缩略图重点：丹房炉火，青铜丹炉，丹药与紫烟

```text
An alchemy room with a bronze furnace, glowing pills, purple smoke and shelves of herbs. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `shanmen.png` · 山门
> 设施 · 常见。缩略图重点：青岚宗山门，石狮与云阶，晨光

```text
The grand stone gate of a mountain sect, stone lions, cloud steps, morning light and pine silhouettes. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `hushandazhen.png` · 护山大阵
> 设施 · 稀有。缩略图重点：夜色护山大阵，金色阵纹笼罩群峰，魔气被挡

```text
A golden protective formation dome over a mountain sect at night, glowing runes in the sky, dark demonic mist breaking against it. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

#### `yaoyuan.png` · 药园
> 设施 · 常见。缩略图重点：药园百草，灵蝶与竹篱，药童浇水

```text
A lush medicinal herb garden with a bamboo fence, glowing herbs, a young disciple watering plants, butterflies. Chinese ink-wash xianxia illustration, muted jade green and old gold palette, rice-paper texture, soft mist, elegant negative space, cinematic soft rim light, refined brushwork, high detail, centered composition, strong readable silhouette, square 1:1, transparent background, no text, no border, no watermark.
```

## 2. 背景（1 张）
### `bg-sect.png`
> 2560×1440 或 1920×1080；中央 60% 尽量干净，山云细节放边缘。

```text
A vast dark Chinese ink-wash xianxia mountain landscape at night, layered misty peaks, distant sect rooftops and pine silhouettes near the edges, calm empty center, soft moonlight, muted jade green and old gold, rice-paper grain, low contrast, cinematic 16:9, no people, no text, no border, no watermark.
```

## 3. 标题（1 张）
### `title-qinglan.png`
> **最稳的做法**：用书法字体/手写「青岚宗」导出透明 PNG（1600×500 左右），不要交给图像模型写汉字。
> 如果一定要用图像模型，下面 prompt 要求恰好三个字；生成后务必检查有没有错字。

```text
Three large Chinese calligraphy characters "青岚宗" in ancient semi-cursive script, brushed gold ink with subtle texture, centered, transparent background, one small red seal accent, no extra text, no border, high resolution, elegant xianxia title lettering, 1600x500.
```

**标题专用负面词**：
```text
extra characters, misspelled characters, gibberish, English letters, watermark, logo, background scene, border, frame, low resolution
```

## 4. 事件图（可选，11 张）
> 960×540，16:9，暗边，无文字；用于事件弹层顶部。

### `events/yaoshou.png` · 妖兽袭山
> 夜色中妖兽冲撞山门，弟子举剑，火光与碎木

```text
A huge shadowy beast attacking the mountain sect gate at night, disciples with swords and torches, splintered wood and sparks. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/lingyu.png` · 灵雨普降
> 灵雨洒落群峰，草木发光，弟子仰头

```text
A gentle spirit rain falling over misty peaks, glowing herbs and trees, disciples looking up in awe. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/sanxiu.png` · 散修来投
> 一名散修踏云而来，山门前拱手

```text
A lone wandering cultivator arriving on a cloud at the sect gate, cupped hands greeting, misty stairs. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/shuijuan.png` · 仙盟征税
> 仙盟使者持卷轴征税，宗门大殿，弟子低头

```text
An envoy from the immortal alliance holding a tax scroll in the sect hall, disciples bowing, cold morning light. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/tiaoxin.png` · 邻宗挑衅
> 邻宗弟子在山门挑衅，青岚弟子持剑相对

```text
Rival sect disciples taunting at the gate, young Qinglan disciples drawing swords, tense standoff. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/mijing.png` · 秘境开启
> 后山秘境裂开，光门与古卷，藤蔓

```text
A secret realm opening behind the mountain, a glowing rift with ancient scrolls and vines. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/xiangrui.png` · 天降祥瑞
> 紫气东来，山门上空霞光与仙鹤

```text
Auspicious purple clouds over the sect gate, cranes circling, golden light and drifting petals. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/wenyi.png` · 时疫
> 瘟疫阴云，药园弟子熬药，病榻与药炉

```text
A plague shadow over the sect, an herbalist boiling medicine, a sick disciple on a bed, dim lantern. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/moxiu.png` · 魔修夜袭
> 魔修夜袭，黑气与剑光，山门火起

```text
Demonic cultivators attacking at night, black mist and sword light, the sect gate on fire. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/wudao.png` · 弟子顿悟
> 弟子溪畔顿悟，水花与道韵光环

```text
A disciple attaining enlightenment by a stream, water droplets suspended, a halo of dao rhythm. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `events/shangdui.png` · 商队借宿
> 商队夜宿山门，马车与灯笼，茶汤

```text
A merchant caravan resting at the sect gate at night, wagons, lanterns, tea steam and tired horses. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

## 5. 结局图（可选，2 张）
> 1280×720，16:9，暗边，无文字。

### `endings/win.png` · 胜利

```text
Dawn golden light over the sect gate, clouds parting, cultivators arriving from the sky, the master standing on the stone steps, banners and petals. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

### `endings/lose.png` · 失败

```text
A broken sect gate in cold rain, fallen leaves, a lone disciple walking down the mountain path, an extinguished lantern. Chinese ink-wash xianxia concept art, muted jade green and old gold palette, rice-paper texture, soft mist, dramatic cinematic lighting, dark vignette edges, elegant negative space, high detail, 16:9, no text, no border, no watermark.
```

## 6. 音频清单（无 prompt）
> 没有音频也能玩；先做 7 个核心文件即可。BGM 必须可循环，SFX 不要刺耳。

| 文件名 | 用途 | 时长/要求 |
| --- | --- | --- |
| `bgm.mp3` | 背景音乐 | 90–120 秒可循环；古琴/箫/环境声，低动态，不要突然高潮 |
| `draw.mp3` | 抽牌 | 0.2–0.4 秒；纸张摩擦/轻风 |
| `play.mp3` | 出牌 | 0.2–0.5 秒；纸牌落桌/墨笔落纸 |
| `coin.mp3` | 灵石入账 | 0.3–0.6 秒；玉石轻碰/铜钱 |
| `event.mp3` | 事件警示 | 0.6–1.2 秒；低鼓/钟磬，不要刺耳 |
| `win.mp3` | 胜利 | 2–4 秒；上行古琴/箫/人声铺底 |
| `lose.mp3` | 失败 | 2–4 秒；下行低弦/风声，收束 |
| `buy.mp3` | 购入（可选） | 0.2–0.5 秒；钱币+纸袋 |
| `refresh.mp3` | 换货（可选） | 0.3–0.6 秒；牌堆洗牌 |
| `click.mp3` | 按钮（可选） | 0.05–0.15 秒；木鱼/轻点 |

音频规格：MP3 44.1kHz；BGM 90–120 秒可循环，低动态；SFX 0.2–1 秒；整体不削波。

## 7. 视频概念（可选，P3）
> 当前卡牌经营界面不需要视频；如果做，建议只做 3 个短文件，不要做长动画。

| 文件名 | 提示词 / 做法 | 要求 |
| --- | --- | --- |
| `video/intro.mp4` | Slow cinematic drift through dark misty ink-wash mountains at dawn, distant sect rooftops, faint golden light, seamless loop, no text, no people. | 6–10 秒，1920×1080，静音，<8MB |
| `video/win.mp4` | Golden dawn light blooming over the sect gate, clouds parting, light motes and petals, slow push-in, no text. | 4–6 秒，静音 |
| `video/lose.mp4` | Ink washes over a broken sect gate in cold rain, falling leaves, slow pull-back, no text. | 4–6 秒，静音 |

> 视频模型容易跳帧；最好先用上面已确认的静帧做 image-to-video，保持同一构图和色调。

## 8. 交付方式
1. 按文件名放进 `public/assets/cards/`、`public/assets/audio/`、`public/assets/events/`、`public/assets/endings/`、`public/assets/video/`。
2. 文件名不同先给我映射表；不要直接覆盖同名文件。
3. 卡图透明背景最好；如果只能出纯色底，用 `#0c1411`，告诉我，我来抠/混合。
4. **先发 3–5 张样图**（背景、标题、`caishi`、`jiangdao`、`lingtian`）即可，我接入后给你桌面/手机截图；确认后再批量。
5. 音频先给 1 个 BGM + 1 个出牌音效即可试听；视频最后做。

## 9. 我会怎么接入
- 卡图：手牌/坊市/八景统一用 `<img>` + `onerror` 回退到汉字 glyph；没图也不会破。
- 背景：叠加在现有 CSS 山景下方，保留暗色渐变保证文字可读。
- 标题：顶栏与开场共用；透明 PNG 直接叠在墨色底上。
- 音频：首次用户点击后启动 BGM；抽牌/出牌/购入/事件/胜负分别触发；提供静音按钮。
- 事件/结局图：弹层顶部或结算页背景；没有图时保持现有排版。
- 视频：只在开场/结局按需加载，不阻塞首屏。

> 建议下一步：先做 **Batch 1 的背景、标题、`caishi`、`jiangdao`、`lingtian`** 五张样图。我接入后给你桌面/手机截图，再决定是否批量。
