<template>
  <div class="transition" :style="layerStyle">
    <Header />
    <div class="search-input">
      <a-input-search
        v-model="query"
        type="text"
        size="large"
        :allow-clear="true"
        placeholder="请输入"
        :loading="searching"
        search-button
        @press-enter="triggerSearch"
        @search="triggerSearch"
      />
    </div>
  </div>
  <result
    v-if="showResult"
    :query="query"
    :searching="searching"
    @searched="onSearched"
    @failure-query="failureQuery"
  />
</template>

<script lang="ts" setup>
const showResult = ref(false)
const searching = ref(false)
const query = ref('')
const layerStyle = ref('')

const triggerSearch = () => {
  if (!searching.value && query.value.trim() !== '') {
    searching.value = true
    layerStyle.value = 'transform: translateY(0)'
    setTimeout(() => {
      showResult.value = true
    }, 300)
  }
}

const failureQuery = (keyword: string) => {
  query.value = keyword
  triggerSearch()
}

const onSearched = () => {
  searching.value = false
}
</script>

<style lang="less" scoped>
.search-input {
  width: 540px;
  line-height: 32px;
  :deep(.arco-input-wrapper) {
    .arco-input {
      font-size: 16px;
    }
    background-color: var(--color-white-0);
  }
}
.transition {
  transform: translateY(300px);
  display: flex;
  align-items: center;
  flex-direction: column;
  transition: transform 0.3s ease-out;
}
</style>
