<script setup lang="ts">
const extendedActions = ref(undefined)

onMounted(async () => extendedActions.value = (await browser.storage.local.get('extendedActions')).extendedActions ?? true)

watchEffect(() => {
  console.log('changed extendedActions', extendedActions.value)
  browser.storage.local.set({ extendedActions: extendedActions.value })
})
</script>

<template>
  <main>
    <fieldset>
      <legend>Options (more customization coming soon)</legend>
      <div>
        <input id="extendedActions" v-model="extendedActions" type="checkbox" name="extendedActions">
        <label for="extendedActions">Extended actions</label>
      </div>
    </fieldset>
  </main>
</template>
