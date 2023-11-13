import fs from 'node:fs'
import path from 'node:path'

export function isChinese(word: string): boolean {
  return /[\u4e00-\u9fa5]+/.test(word)
}

export function isEnglish(word: string): boolean {
  return /[a-zA-Z-]+/.test(word)
}

// 读取pages文件夹下的所有文件
export function readDocs(): string[] {
  console.log(__dirname)
  const pagesPath = path.resolve(__dirname, '../../pages')
  console.log(pagesPath)
  try {
    const files = fs.readdirSync(pagesPath)
    return files.map((filename) =>
      fs.readFileSync(path.resolve(pagesPath, filename), 'utf-8')
    )
  } catch (e) {
    throw e
  }
}

// 计算编辑距离
export function calcEditDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = []
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j
      } else if (j === 0) {
        dp[i][j] = i
      } else if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i][j - 1], // 插入
            dp[i - 1][j], // 删除
            dp[i - 1][j - 1] // 替换
          )
      }
    }
  }

  return dp[m][n]
}

export function topK(nums: [number, number][], k: number): [number, number][] {
  const heap: [number, number][] = nums.slice(0, k)

  for (let i = k; i < nums.length; i++) {
    if (nums[i][1] > heap[0][1]) {
      heap[0] = nums[i]
      heapify(heap, 0, k)
    }
  }

  return heap.sort((a, b) => b[1] - a[1])
}
function heapify(nums: [number, number][], i: number, size: number) {
  const left = 2 * i + 1
  const right = 2 * i + 2
  let smallest = i

  if (left < size && nums[left][1] < nums[smallest][1]) {
    smallest = left
  }

  if (right < size && nums[right][1] < nums[smallest][1]) {
    smallest = right
  }

  if (smallest !== i) {
    ;[nums[i], nums[smallest]] = [nums[smallest], nums[i]]
    heapify(nums, smallest, size)
  }
}

export function handleDocs(docs: string) {
  const url = /(?:\[url\]:\s+)(.*)/.exec(docs)?.[1] ?? ''
  let title = '',
    content = ''
  let isTitle = true
  for (const str of docs.split('\n')) {
    if (str === '' || /^\s*$/.test(str) || /(?:\[url\]:\s+)(.*)/.test(str)) {
      continue
    }
    if (isTitle) {
      title = str
      isTitle = false
    } else {
      content += str + '\n'
    }
  }
  return { url, title, content }
}

export function logTime(name: string, cb: Function) {
  console.time(name)
  let result = cb()
  console.timeEnd(name)
  return result
}
