import {
  readDocs,
  isChinese,
  handleDocs,
  calcEditDistance,
  topK,
  isEnglish,
} from './utils'
import jieba from '@node-rs/jieba'
import { stemmer } from 'stemmer'

class Engine {
  // 文档集合
  docs: string[]
  // 词项集合（无重复）
  wordSet: Set<string> = new Set()
  // 倒排索引表 word => [docId]
  indexedMap: Map<string, number[]> = new Map()
  // 文档及其对应的词项列表 docId => [word]
  terms: Map<number, string[]> = new Map()
  // 词项及其对应的idf值 word => idf
  idfMap: Map<string, number> = new Map()
  // 文档及其对应的词项及该词项对应的tf-idf值 docId => word => tf-idf
  tfIdfMatrix: Map<number, Map<string, number>> = new Map()

  constructor() {
    // 从pages读取文档
    console.time('readDocs')
    this.docs = readDocs()
    // 构建索引表
    console.timeEnd('readDocs')
    console.time('buildIndexedMap')
    this.buildIndexedMap()
    console.timeEnd('buildIndexedMap')
    // 初始化 tfIdfMap和tfIdfMatrix，供搜索时计算使用
    console.time('calcTfIdf')
    this.calcTfIdf()
    console.timeEnd('calcTfIdf')
  }
  // 查询函数 ！
  search(query: string) {
    console.time('query')
    const { cosineSimilarity, queryWords: words } =
      this.calcCosineSimilarity(query)
    let code = 1,
      data = []
    const similarity = Array.from(cosineSimilarity.entries())
    if (similarity.length === 0) {
      data = this.errorCorrection(query).slice(0, 3)
      code = 0
    } else {
      const res = topK(similarity, 10)
      const docs = res.map((item) => this.docs[item[0]])
      data = docs.map((item) => handleDocs(item))
    }
    console.timeEnd('query')

    return {
      code,
      data,
      words,
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
        } else if (isEnglish(word)) {
          // 英文词干提取
          word = stemmer(word)
          this.buildIndexedMapHelper(word, docId, wordList)
        }
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
  calcTfIdfHelper() {
    const df = (word: string) => new Set(this.indexedMap.get(word)).size
    const idf = (df: number) => Math.log(this.docs.length / df)
    this.wordSet.forEach((word) => {
      const dfVal = df(word)
      this.idfMap.set(word, idf(dfVal))
    })
  }
  // tf-idf计算
  calcTfIdf(): void {
    this.calcTfIdfHelper()
    // 计算公式
    const tf = (word: string, docId: number) =>
      this.indexedMap.get(word)!.filter((item) => item === docId).length

    // 文档及其对应的词项及该词项对应的tf-idf值 docId => word => [tf-idf]
    this.terms.forEach((termsOfDoc, docId) => {
      const termMap = new Map()
      termsOfDoc.forEach((term) => {
        const tfidf = tf(term, docId) * this.idfMap.get(term)!
        termMap.set(term, tfidf)
      })
      this.tfIdfMatrix.set(docId, termMap)
    })
  }
  // query的tf-idf计算
  queryTfIdf(query: string): Map<string, number> {
    // 计算公式
    const df = (word: string) => words.filter((w) => w === word).length
    const tf = (word: string) => df(word) / words.length

    // query对应的tf-idf向量 word => [tf-idf]
    const queryTfIdfVec: Map<string, number> = new Map()
    // 中文分词
    const words = jieba.cutForSearch(query, true)
    words.forEach((word) => {
      if (isChinese(word)) {
        queryTfIdfVec.set(word, tf(word))
      } else if (isEnglish(word)) {
        word = stemmer(word)
        queryTfIdfVec.set(word, tf(word))
      }
    })
    return queryTfIdfVec
  }
  // 余弦相似度计算
  calcCosineSimilarity(query: string): {
    cosineSimilarity: Map<number, number>
    queryWords: string[]
  } {
    const queryTfIdfVec = this.queryTfIdf(query)

    // docId => word => tf-idf
    const cosineSimilarity: Map<number, number> = new Map()
    this.tfIdfMatrix.forEach((docTfIdfVec, docId) => {
      // query对单个文档的词项的余弦相似度列表 word => [tf-idf]
      let dot = 0,
        v1Norm = 0,
        v2Norm = 0

      let docTfIdf
      queryTfIdfVec.forEach((wordTfIdf, word) => {
        // 得到组成query词项的tf-idf向量
        docTfIdf = docTfIdfVec.get(word)
        if (docTfIdf === undefined) {
          return
        } else {
          dot += wordTfIdf * docTfIdf
          v1Norm += wordTfIdf * wordTfIdf
          v2Norm += docTfIdf * docTfIdf
        }
      })
      const denominator = Math.sqrt(v1Norm) * Math.sqrt(v2Norm)
      let similarity = denominator == 0 ? 0 : dot / denominator
      if (similarity > 0) cosineSimilarity.set(docId, similarity)
    })
    return { cosineSimilarity, queryWords: [...queryTfIdfVec.keys()] }
  }
}

const engine = new Engine()

export default engine
