# information-retrieval

2023 年春季信息检索大作业，实现一个简易的深大 40 周年校庆网公文检索系统，完成于 6.12-6.16。

## Technology Stack

前端：Vue3 + Arco Design，组件按需加载，公文中搜索词高亮，失败提供候选词。

后端：Express + Python 爬虫，检索系统逻辑用 Typescript 实现，处理爬取的公文得到倒排索引表，计算 TF-IDF 并进一步得到余弦相似度，返回 TopK 排序后最相似的 10 篇文档。

## How to run this project?

Typescript 环境推荐 node>=16.18.0，pnpm>=8，在 frontend 和 backend 两个目录下执行:

```
pnpm install
pnpm run dev
```

即可启动项目。

对于爬虫程序，使用 pip 安装相应依赖，并创建 config.ini 文件，写入账号密码，保证可访问内部网，然后运行：

```
python python/spider.py
```

得到的文章会输出在 pages 文件夹中。

---

2023.11 重构项目目录，测试 bun 原生服务端性能，明显优于 express。
