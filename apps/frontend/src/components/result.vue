<template>
  <div v-if="failureData.length" href="" style="margin-top: 12px">
    你可能想搜 ？
    <a-space>
      <a-link
        v-for="item in failureData"
        :key="item"
        @click="failureQuery(item)"
      >
        {{ item }}
      </a-link>
    </a-space>
  </div>
  <a-space :size="[50, 0]" class="query-time-space">
    <div class="query-time">查询时间 {{ queryTime / 1e6 }} ms</div>
  </a-space>
  <a-list class="result" :data="dataSource" :pagination-props="pagination">
    <template #item="{ item, index }">
      <a-list-item :key="index">
        <a-list-item-meta>
          <template #title>
            <a-link
              class="page-link"
              :href="item.url"
              v-html="item.title"
            ></a-link>
          </template>
          <template #description>
            <p class="content" v-html="item.content"></p>
          </template>
        </a-list-item-meta>
      </a-list-item>
    </template>
  </a-list>
</template>

<script lang="ts" setup>
import axios from 'axios'
import type { PaginationProps } from '@arco-design/web-vue/es/pagination'
import { Message } from '@arco-design/web-vue'

interface Article {
  title: string
  content: string
  url: string
}

const props = defineProps({
  query: {
    type: String,
    required: true,
  },
  searching: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['searched', 'failure-query'])

const dataSource = ref<Article[]>([])
const pagination: ComputedRef<PaginationProps> = computed(() => ({
  pageSize: 3,
  showTotal: true,
  total: dataSource.value.length,
}))
const queryTime = ref(NaN)
const failureData = ref<string[]>([])
const failureQuery = (query: string) => {
  emit('failure-query', query)
}
const queryKeyWord = async (query: string) => {
  try {
    const {
      data: { code, words, data, time },
    } = await axios({
      url: 'api/query',
      method: 'post',
      data: {
        query,
      },
      timeout: 1000,
    })
    console.log(`查询：${query}`, code, time, data)
    queryTime.value = time
    if (code == 1) {
      Message.success({
        content: '查询成功',
        duration: 1000,
      })
      // 结果中高亮query
      const reg = new RegExp('[' + words.join('|') + ']', 'g')
      dataSource.value = (data as Article[]).map((article) => {
        return {
          ...article,
          ...{
            title: article.title.replaceAll(
              reg,
              (e) => `<span style="background-color:#ffff00">${e}</span>`
            ),
            content: article.content.replaceAll(
              reg,
              (e) => `<span style="background-color:#ffff00">${e}</span>`
            ),
          },
        }
      })

      failureData.value = []
    } else {
      Message.error({
        content: '查询失败',
        duration: 1000,
      })
      failureData.value = data
      dataSource.value = []
    }
  } catch (err) {
    Message.error({
      content: '请求失败',
      duration: 1000,
    })
    console.error(err)
  }
}

watchEffect(async () => {
  if (props.searching) {
    const query = props.query.trim()
    if (query !== '') {
      await queryKeyWord(query)
      emit('searched')
    }
  }
})
</script>

<style lang="less" scoped>
.query-time {
  color: var(--color-black-1);
  right: 18vw;
  &-space {
    margin-top: 20px;
    align-self: baseline;
    position: relative;
    left: 20vw;
  }
}
.result {
  margin-top: 20px;
  padding-bottom: 20px;
  border-radius: 8px 0 0 8px;
  background-color: var(--color-white-0);
  width: 56vw;
  box-shadow: 0px 0px 20px 0px rgba(173, 186, 204, 0.2);
  :deep(.arco-list-item) {
    padding: 20px 40px !important;
  }
  .content {
    font-size: 15px;
    color: var(--color-black-0);
  }
}
.page-link {
  font-size: 18px;
}
</style>
