# information-retrieval
2023年春季信息检索大作业，实现一个简易的深大40周年校庆网公文检索系统，完成于6.12-6.16。

## Technology Stack
前端：Vue3 + Arco Design，组件按需加载，公文中搜索词高亮，失败提供候选词。

后端：Express + Python爬虫，检索系统逻辑用Typescript实现，处理爬取的公文得到倒排索引表，计算TF-IDF并进一步得到余弦相似度，返回TopK排序后最相似的10篇文档。

## How to run this project?
Typescript环境推荐 node>=16.18.0，pnpm>=8，在frontend和backend两个目录下执行:
```
pnpm install
pnpm run dev
```
即可启动项目。

对于爬虫程序，使用pip安装相应依赖，并创建config.ini文件，写入账号密码，保证可访问内部网，然后运行：
```
python python/spider.py
```
得到的文章会输出在pages文件夹中。
