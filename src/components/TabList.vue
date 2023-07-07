<script setup lang="ts">
import type { TabItem } from '~/composables/utils'

const props = defineProps({
  name: String,
  items: Array<TabItem>,
})

onUpdated(() => console.log(props.items))
</script>

<template>
  <div flex-row border border-rounded w-xl>
    <div text-lg bg-blue-2>
      {{ name }}
    </div>
    <ul>
      <li v-for="item in props.items" :key="item.id" flex gap-1em p-1em>
        <img :src="item.favIconUrl" w-5 h-5>
        <div>{{ item.title }}</div>
        <div>{{ item.url }}</div>
      </li>
    </ul>
  </div>
</template>
