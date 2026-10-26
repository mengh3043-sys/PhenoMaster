export const CONTACT_EMAIL = "3104907947@qq.com";

export type TreeNode = { id: string; name: string; public: boolean; children?: TreeNode[] | undefined };

export const dataTree: TreeNode[] = [
  {
    id: "d0", name: "表型数据", public: true, children: [
      { id: "d1", name: "小麦文档", public: true, children: [
        { id: "d11", name: "郑州-2024 小麦试验", public: true },
        { id: "d12", name: "新乡-2025 干旱胁迫", public: false },
      ] },
      { id: "d2", name: "玉米文档", public: true, children: [
        { id: "d21", name: "北京-2024 自交系群体", public: true },
        { id: "d22", name: "北京-2025 密植试验", public: false },
      ] },
      { id: "d3", name: "水稻文档", public: true, children: [
        { id: "d31", name: "武汉-2025 褐飞虱抗性", public: true },
      ] },
    ],
  },
];

export const imageTree: TreeNode[] = [
  {
    id: "i0", name: "种苗图片", public: true, children: [
      { id: "i1", name: "test11", public: true, children: [
        { id: "i11", name: "曾老师课题组", public: true },
        { id: "i12", name: "温室 RGB（私有）", public: false },
      ] },
      { id: "i2", name: "实验田一", public: true },
      { id: "i3", name: "水稻虫害", public: false },
    ],
  },
];

export type ReviewStatus = "草稿" | "待审核" | "已审核" | "已驳回" | "用户私有";

export const phenotypeFiles = [
  { id: 10231, name: "wheat_zz_2024_plant_height.csv", desc: "株高、穗长、千粒重", crop: "小麦", owner: "曾老师", size: "2.4 MB", rows: 1280, public: true, status: "已审核" as ReviewStatus, date: "2026-09-28" },
  { id: 10232, name: "wheat_xx_2025_drought.csv", desc: "干旱胁迫下叶绿素 SPAD", crop: "小麦", owner: "李明", size: "1.1 MB", rows: 640, public: false, status: "待审核" as ReviewStatus, date: "2026-10-02" },
  { id: 10233, name: "maize_inbred_2024.csv", desc: "自交系穗部性状", crop: "玉米", owner: "曾老师", size: "3.8 MB", rows: 2100, public: true, status: "已审核" as ReviewStatus, date: "2026-09-15" },
  { id: 10234, name: "maize_density_2025_ndvi.csv", desc: "UAV NDVI 时序", crop: "玉米", owner: "王芳", size: "5.2 MB", rows: 4096, public: false, status: "草稿" as ReviewStatus, date: "2026-10-04" },
  { id: 10235, name: "rice_bph_2025.csv", desc: "褐飞虱抗性评分", crop: "水稻", owner: "李明", size: "0.9 MB", rows: 512, public: true, status: "待审核" as ReviewStatus, date: "2026-10-03" },
  { id: 10236, name: "rice_yield_2024.csv", desc: "单株产量与分蘖", crop: "水稻", owner: "张强", size: "1.7 MB", rows: 960, public: true, status: "已驳回" as ReviewStatus, date: "2026-09-20" },
];

export const previewRows = [
  { material: "ZM-001", rep: 1, plot: "A01", height: 82.4, spike: 9.1, tkw: 43.2 },
  { material: "ZM-001", rep: 2, plot: "B07", height: 80.9, spike: 8.8, tkw: 42.6 },
  { material: "ZM-014", rep: 1, plot: "A02", height: 76.3, spike: 8.2, tkw: 45.8 },
  { material: "ZM-014", rep: 2, plot: "B11", height: 77.8, spike: 8.5, tkw: 46.1 },
  { material: "XN-979", rep: 1, plot: "A03", height: 88.1, spike: 10.2, tkw: 39.7 },
  { material: "XN-979", rep: 2, plot: "B02", height: 87.5, spike: null, tkw: 40.3 },
];

export const traitByMaterial = [
  { material: "ZM-001", 株高: 81.6, 穗长: 8.9, 千粒重: 42.9 },
  { material: "ZM-014", 株高: 77.0, 穗长: 8.3, 千粒重: 45.9 },
  { material: "XN-979", 株高: 87.8, 穗长: 10.2, 千粒重: 40.0 },
  { material: "BN-207", 株高: 79.2, 穗长: 9.4, 千粒重: 44.1 },
  { material: "JM-22", 株高: 84.5, 穗长: 9.8, 千粒重: 41.5 },
];

export const multiTrial = [
  { material: "ZM-001", mean: 81.6, max: 86.2, min: 76.8, sd: 2.9, cv: "3.6%" },
  { material: "ZM-014", mean: 77.0, max: 80.4, min: 73.1, sd: 2.2, cv: "2.9%" },
  { material: "XN-979", mean: 87.8, max: 92.0, min: 83.5, sd: 3.1, cv: "3.5%" },
  { material: "BN-207", mean: 79.2, max: 83.9, min: 75.0, sd: 2.6, cv: "3.3%" },
];

export const uploadTrend = [
  { month: "4月", 表型文件: 42, 图片: 820 },
  { month: "5月", 表型文件: 58, 图片: 1240 },
  { month: "6月", 表型文件: 71, 图片: 1610 },
  { month: "7月", 表型文件: 66, 图片: 2050 },
  { month: "8月", 表型文件: 89, 图片: 1890 },
  { month: "9月", 表型文件: 104, 图片: 2430 },
];

export const typeShare = [
  { name: "形态性状", value: 38 },
  { name: "产量性状", value: 24 },
  { name: "生理生化", value: 18 },
  { name: "抗逆性状", value: 12 },
  { name: "品质性状", value: 8 },
];

export const materials = [
  { code: "ZM-001", name: "郑麦 001", crop: "小麦", source: "河南农科院", pedigree: "周麦18 × 矮抗58", target: "高产稳产" },
  { code: "ZM-014", name: "郑麦 014", crop: "小麦", source: "河南农科院", pedigree: "郑麦9023 × 百农207", target: "优质强筋" },
  { code: "XN-979", name: "新农 979", crop: "小麦", source: "新乡农科所", pedigree: "新麦26 × 周麦22", target: "抗旱" },
  { code: "JM-22", name: "京玉 22", crop: "玉米", source: "北京农林科学院", pedigree: "京724 × 京92", target: "耐密" },
  { code: "YD-6", name: "扬稻 6 号", crop: "水稻", source: "江苏里下河所", pedigree: "9311 选系", target: "抗褐飞虱" },
];

export const trials = [
  { code: "T-2024-ZZ", name: "2024 郑州小麦区试", site: "郑州", design: "随机区组 3 重复", plots: 96, status: "已完成" },
  { code: "T-2025-XX", name: "新乡-2025 干旱胁迫", site: "新乡", design: "裂区设计 2 处理", plots: 64, status: "进行中" },
  { code: "T-2025-YZ", name: "2025 扬州褐飞虱抗性", site: "扬州", design: "完全随机 4 重复", plots: 48, status: "进行中" },
];

export const news = {
  小麦: [
    { type: "论文", title: "基于无人机多光谱的小麦株高与生物量高通量估算", src: "Plant Phenomics · 2026" },
    { type: "新闻", title: "黄淮麦区抗旱品种田间表型联合鉴定启动", src: "农业农村部 · 09-21" },
    { type: "会议", title: "第五届全国小麦表型组学研讨会（郑州）", src: "2026-11-08" },
    { type: "报告", title: "2025 年度小麦干旱胁迫表型数据集发布说明", src: "平台数据中心" },
  ],
  玉米: [
    { type: "论文", title: "深度学习驱动的玉米雄穗表型自动识别", src: "Computers and Electronics in Agriculture" },
    { type: "新闻", title: "东北玉米密植试验 NDVI 时序数据完成入库", src: "平台公告 · 09-30" },
    { type: "会议", title: "国际植物表型大会 IPPS 2026 分会场", src: "2026-12-02" },
    { type: "报告", title: "玉米自交系穗部性状年度统计报告", src: "平台数据中心" },
  ],
  水稻: [
    { type: "论文", title: "YOLO 系列模型在褐飞虱检测中的应用评估（mAP50 0.949）", src: "课题组内部报告" },
    { type: "新闻", title: "长江中下游水稻虫害监测网络扩容", src: "中国水稻所 · 09-12" },
    { type: "会议", title: "水稻表型与智能育种论坛", src: "2026-10-25" },
    { type: "报告", title: "扬州褐飞虱抗性试验阶段性成果", src: "平台数据中心" },
  ],
} as const;

export const users = [
  { id: 1, name: "admin", nick: "超级管理员", dept: "平台研发组", role: "超级管理员", phone: "138****0001", status: true, created: "2024-03-01" },
  { id: 2, name: "曾老师", nick: "曾老师", dept: "小麦育种课题组", role: "课题负责人", phone: "139****2231", status: true, created: "2024-05-12" },
  { id: 3, name: "liming", nick: "李明", dept: "水稻课题组", role: "普通用户", phone: "137****8890", status: true, created: "2025-02-18" },
  { id: 4, name: "wangfang", nick: "王芳", dept: "玉米课题组", role: "普通用户", phone: "136****5512", status: false, created: "2025-06-03" },
  { id: 5, name: "zhangq", nick: "张强", dept: "水稻课题组", role: "数据审核员", phone: "135****7720", status: true, created: "2025-09-09" },
];

export type NewsItem = { id: string; crop: "小麦" | "玉米" | "水稻"; type: "论文" | "新闻" | "会议" | "报告"; title: string; src: string };
export const newsList: NewsItem[] = (Object.keys(news) as (keyof typeof news)[]).flatMap((crop) =>
  news[crop].map((n, i) => ({ id: `${crop === "小麦" ? "w" : crop === "玉米" ? "m" : "r"}${i + 1}`, crop, type: n.type, title: n.title, src: n.src })),
);

export const caseList = [
  { id: "rice-bph", title: "扬州水稻试验田 · 褐飞虱抗性监测", site: "江苏扬州", period: "2025.06 – 2025.10", desc: "UAV 巡田 + YOLO 识别，mAP50 达 94.9%，单张推理 0.8ms",
    body: "在扬州 48 个小区布设无人机定期巡田，采集 1000 余张冠层与茎基部图像，上传至平台「水稻虫害」图片节点。使用 YOLO 模型训练约 100 轮，半小时完成千张图片处理，识别结果与抗性评分表型文件按材料联动，辅助筛选抗褐飞虱材料。",
    metrics: [["mAP50", "94.9%"], ["Precision", "93.4%"], ["Recall", "90.7%"], ["推理速度", "0.8 ms"]] },
  { id: "maize-gantry", title: "新乡玉米密植试验 · 龙门式表型车", site: "河南新乡", period: "2025.05 – 2025.09", desc: "多相机同步采集株高、叶面积与 NDVI 时序数据",
    body: "龙门式表型车搭载 RGB、多光谱与激光雷达，按周扫描 64 个密植小区。远程连接程序将设备图片自动上传至平台，NDVI 时序文件经模板校验后入库，用于多试验性状分析与耐密品种筛选。",
    metrics: [["小区数", "64"], ["采集图片", "18,400"], ["NDVI 记录", "4,096"], ["性状", "12 项"]] },
  { id: "wheat-greenhouse", title: "郑州小麦温室 · 苗期高通量成像", site: "河南郑州", period: "2024.11 – 2025.03", desc: "RGB 自动上传至图片节点，与表型文件按材料联动",
    body: "温室成像平台每日拍摄苗期小麦，图片通过「图片自动上传」功能实时进入节点；节点详情记录拍摄设备、时间、处理方式。株高、叶色等表型文件与图片按材料编号关联，实现图数联动。",
    metrics: [["材料数", "320"], ["日均图片", "1,200"], ["表型文件", "46"], ["数据缺失率", "1.8%"]] },
];
