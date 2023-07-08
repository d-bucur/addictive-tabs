<script setup lang="ts">
import type { TabItem } from '~/composables/utils'

// TODO use typed props and emits
const props = defineProps({
  name: String,
  items: Array<TabItem>,
  id: String,
})

const emit = defineEmits(['bind', 'persist'])

onUpdated(() => console.log(props.items))
</script>

<template>
  <div flex-row border border-rounded w-xl>
    <div text-lg bg-blue-2>
      {{ name }}
    </div>
    <button @click="emit('bind', id)">
      Bind
    </button>
    <button @click="emit('persist', id)">
      Persist
    </button>
    <ul>
      <li v-for="item in props.items" :key="item.id" flex flex-content-start gap-1em p-1em>
        <img :src="item.favIconUrl" w-5 h-5>
        <div :title="item.url" text-left>
          {{ item.title }}
        </div>
      </li>
    </ul>
  </div>
</template>
