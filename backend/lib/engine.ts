import {
  readDocs,
  isChinese,
  handleDocs,
  calcEditDistance,
  topK,
} from './utils'
import jieba from '@node-rs/jieba'
import { stemmer } from 'stemmer'

interface Article {
  url: string
  title: string
  content: string
}

class Engine {
  // 文档集合
  docs: string[]
  // 词项集合（无重复）
  wordSet: Set<string> = new Set()
  // 倒排索引表 word => [docId]
  indexedMap: Map<string, number[]> = new Map()
  // 文档及其对应的词项列表 docId => [word]
  terms: Map<number, string[]> = new Map()
  // 词项及其对应的tf-idf值 word => [tf-idf]
  tfIdfMap: Map<string, number[]> = new Map()
  // 文档及其对应的词项及该词项对应的tf-idf值 docId => word => [tf-idf]
  tfIdfMatrix: Map<string, number[]>[] = new Array()

  constructor() {
    // 从pages读取文档
    this.docs = readDocs()
    // 构建索引表
    this.buildIndexedMap()
    // 初始化 tfIdfMap和tfIdfMatrix，供搜索时计算使用
    this.calcTfIdf()
  }
  // 查询函数 ！
  search(query: string): { code: number; data: Article[] | string[] } {
    const similarity = Array.from(this.calcCosineSimilarity(query).entries())
    let code = 1,
      data = []
    if (similarity.length === 0) {
      data = this.errorCorrection(query).slice(0, 3)
      code = 0
    } else {
      const res = topK(similarity, 10)
      const docs = res.map((item) => this.docs[item[0]])
      data = docs.map((item) => handleDocs(item))
    }

    return {
      code,
      data,
    }
  }
  // 纠错
  errorCorrection(query: string): string[] {
    const res = [...this.wordSet].filter(
      (word) => calcEditDistance(query, word) <= 1
    )
    // 随机取三个数
    return res.sort(() => Math.random() - 0.5).slice(0, 3)
  }

  // 构建索引表
  buildIndexedMap(): void {
    this.docs.forEach((doc, docId) => {
      const wordList: string[] = []
      // 中文分词
      const words = jieba.cutForSearch(doc, true)
      words.forEach((word) => {
        if (isChinese(word)) {
          this.buildIndexedMapHelper(word, docId, wordList)
        }
      })
      // 英文词干提取
      const englishWords = [...doc.matchAll(/[a-zA-Z-]+/g)].map(
        (item) => item[0]
      )
      englishWords.forEach((word) => {
        word = stemmer(word)
        this.buildIndexedMapHelper(word, docId, wordList)
      })
      //记录 docId 对应的词项列表
      this.terms.set(docId, wordList)
    })
  }
  // 辅助构建索引表
  buildIndexedMapHelper(word: string, index: number, wordList: string[]): void {
    if (this.indexedMap.has(word)) {
      const indexList = this.indexedMap.get(word)!
      indexList.push(index)
      this.indexedMap.set(word, indexList)
    } else {
      this.indexedMap.set(word, [index])
    }
    wordList.push(word)
    !this.wordSet.has(word) && this.wordSet.add(word)
  }
  // tf-idf计算
  calcTfIdf(): void {
    // 计算公式
    const df = (word: string) => new Set(this.indexedMap.get(word)).size
    const idf = (word: string) => Math.log(this.docs.length / df(word))
    const tf = (word: string, docId: number) =>
      this.indexedMap.get(word)!.filter((item) => item === docId).length

    // 词项及其对应的tf-idf值 word => [tf-idf]
    this.wordSet.forEach((word) => {
      const tfIdfList = this.docs.map((_, docId) => {
        return tf(word, docId) * idf(word)
      })
      this.tfIdfMap.set(word, tfIdfList)
    })
    // 文档及其对应的词项及该词项对应的tf-idf值 docId => word => [tf-idf]
    this.terms.forEach((termsOfDoc, docsId) => {
      const termMap = new Map()
      termsOfDoc.forEach((term) => {
        termMap.set(term, this.tfIdfMap.get(term)!)
      })
      this.tfIdfMatrix.push(termMap)
    })
  }
  // query的tf-idf计算
  queryTfIdf(query: string): Map<string, number[]> {
    // 计算公式
    const df = (word: string) => words.filter((w) => w === word).length
    const tf = (word: string) => df(word) / words.length

    // query对应的tf-idf向量 word => [tf-idf]
    const queryTfIdfVec: Map<string, number[]> = new Map()
    // 中文分词
    const words = jieba.cutForSearch(query, true)
    words.forEach((word) => {
      if (isChinese(word)) {
        if (queryTfIdfVec.has(word)) {
          const value = queryTfIdfVec.get(word)!
          value.push(tf(word))
          queryTfIdfVec.set(word, value)
        } else {
          queryTfIdfVec.set(word, [tf(word)])
        }
      }
    })
    // 英文词干提取
    const englishWords = [...query.matchAll(/[a-zA-Z-]+/g)].map(
      (item) => item[0]
    )
    englishWords.forEach((word) => {
      word = stemmer(word)
      if (queryTfIdfVec.has(word)) {
        const value = queryTfIdfVec.get(word)!
        value.push(tf(word))
        queryTfIdfVec.set(word, value)
      } else {
        queryTfIdfVec.set(word, [tf(word)])
      }
    })
    return queryTfIdfVec
  }
  // 余弦相似度计算
  calcCosineSimilarity(query: string): Map<number, number> {
    const queryTfIdfVec = this.queryTfIdf(query)
    // docId => word => [tf-idf]
    const result: Map<number, number> = new Map()

    this.tfIdfMatrix.forEach((docTfIdfVec, docId) => {
      // query对单个文档的词项的余弦相似度列表 word => [tf-idf]
      const cosineSimilarity: number[] = new Array()
      queryTfIdfVec.forEach((wordTfIdfVec, word) => {
        // 得到组成query词项的tf-idf向量
        const tfIdfVec = docTfIdfVec.get(word)
        if (!tfIdfVec) {
          return
        }
        // 向量点积
        const sum = wordTfIdfVec.reduce(
          (acc, tfIdf, index) => acc + tfIdf * tfIdfVec[index]
        )
        // 向量取模
        const squareSum = (arr: number[]) =>
          arr.reduce((pre, cur) => pre + cur * cur, 0)
        const norm = Math.sqrt(squareSum(wordTfIdfVec) * squareSum(tfIdfVec))

        cosineSimilarity.push(sum / norm)
      })
      // query对单个文档的余弦相似度
      const similarity = cosineSimilarity.reduce((acc, cur) => acc + cur, 0)
      if (similarity > 0) {
        result.set(docId, similarity)
      }
    })
    return result
  }
}

const engine = new Engine()
console.log(engine.search('深圳大学'))

export default engine
