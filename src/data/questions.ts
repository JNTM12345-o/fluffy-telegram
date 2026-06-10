export interface Question {
  id: number
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  category: string
}

export const QUESTION_BANK: Question[] = [
  {
    id: 1,
    text: '世界上最大的海洋是哪一个？',
    options: ['大西洋', '印度洋', '太平洋', '北冰洋'],
    correctIndex: 2,
    category: '地理',
  },
  {
    id: 2,
    text: '人体最大的器官是？',
    options: ['肝脏', '皮肤', '大脑', '心脏'],
    correctIndex: 1,
    category: '科学',
  },
  {
    id: 3,
    text: '一年中最长的月份有多少天？',
    options: ['28 天', '30 天', '31 天', '32 天'],
    correctIndex: 2,
    category: '常识',
  },
  {
    id: 4,
    text: '光在真空中的速度约为？',
    options: ['每秒 3 万公里', '每秒 30 万公里', '每秒 300 万公里', '每秒 3 亿公里'],
    correctIndex: 1,
    category: '科学',
  },
  {
    id: 5,
    text: '「海内存知己，天涯若比邻」出自哪位诗人之手？',
    options: ['李白', '杜甫', '王勃', '白居易'],
    correctIndex: 2,
    category: '文学',
  },
  {
    id: 6,
    text: '世界上最高的山峰是？',
    options: ['乔戈里峰', '珠穆朗玛峰', '干城章嘉峰', '洛子峰'],
    correctIndex: 1,
    category: '地理',
  },
  {
    id: 7,
    text: 'HTML 代表什么？',
    options: [
      'Hyper Trainer Marking Language',
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
    ],
    correctIndex: 1,
    category: '编程',
  },
  {
    id: 8,
    text: '太阳系中距离太阳最近的行星是？',
    options: ['金星', '火星', '水星', '地球'],
    correctIndex: 2,
    category: '科学',
  },
  {
    id: 9,
    text: '中国古代四大发明中，不包括下列哪一项？',
    options: ['造纸术', '火药', '印刷术', '瓷器'],
    correctIndex: 3,
    category: '历史',
  },
  {
    id: 10,
    text: '一部电影时长 120 分钟，它合多少小时？',
    options: ['1 小时', '1.5 小时', '2 小时', '2.5 小时'],
    correctIndex: 2,
    category: '常识',
  },
  {
    id: 11,
    text: 'JavaScript 中哪个关键字用于声明常量？',
    options: ['var', 'let', 'const', 'static'],
    correctIndex: 2,
    category: '编程',
  },
  {
    id: 12,
    text: '世界上面积最小的大洲是？',
    options: ['欧洲', '南极洲', '大洋洲', '北美洲'],
    correctIndex: 2,
    category: '地理',
  },
  {
    id: 13,
    text: '下列哪种动物不是哺乳动物？',
    options: ['鲸鱼', '蝙蝠', '企鹅', '海豚'],
    correctIndex: 2,
    category: '科学',
  },
  {
    id: 14,
    text: '「路漫漫其修远兮，吾将上下而求索」出自？',
    options: ['《诗经》', '《离骚》', '《论语》', '《庄子》'],
    correctIndex: 1,
    category: '文学',
  },
  {
    id: 15,
    text: '奥运会多少年举办一届？',
    options: ['每 2 年', '每 3 年', '每 4 年', '每 5 年'],
    correctIndex: 2,
    category: '常识',
  },
  {
    id: 16,
    text: '计算机的 CPU 指的是？',
    options: ['存储器', '中央处理器', '显卡', '主板'],
    correctIndex: 1,
    category: '编程',
  },
  {
    id: 17,
    text: '中国的首都是？',
    options: ['上海', '北京', '广州', '深圳'],
    correctIndex: 1,
    category: '地理',
  },
  {
    id: 18,
    text: '一公里等于多少米？',
    options: ['100 米', '500 米', '1000 米', '10000 米'],
    correctIndex: 2,
    category: '常识',
  },
  {
    id: 19,
    text: '地球围绕什么旋转？',
    options: ['月亮', '太阳', '银河系', '北极星'],
    correctIndex: 1,
    category: '科学',
  },
  {
    id: 20,
    text: '「天生我材必有用」是哪位诗人的名句？',
    options: ['李白', '苏轼', '辛弃疾', '陆游'],
    correctIndex: 0,
    category: '文学',
  },
]
