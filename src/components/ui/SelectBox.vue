<template>
<div>
<label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
<select v-model="modelValue" class="border rounded px-3 py-2 w-full">
<option value="" disabled>Select...</option>
<option v-for="opt in options" :key="opt.value ?? opt" :value="opt.value ?? opt">{{ opt.label ?? opt }}</option>
</select>
</div>
</template>
<script setup lang="ts">
const props = defineProps({ modelValue: [String, Number], label: String, options: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);
</script>
