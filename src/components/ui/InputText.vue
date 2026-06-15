<template>
<div>
<label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
<input :value="modelValue" v-bind="$attrs" class="border rounded px-3 py-2 w-full" @input="update" />
<p v-if="error" class="text-red-600 text-sm mt-1">{{ error }}</p>
</div>
</template>
<script setup lang="ts">
const props = defineProps({ modelValue: [String, Number], label: String, error: String });
const emit = defineEmits(['update:modelValue']);
function update(v: any) { emit('update:modelValue', v.target ? v.target.value : v); }
</script>
