<template>
<div>
<label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
<select v-model="model" class="border rounded px-3 py-2 w-full">
<option value="" disabled>Select...</option>
<option v-for="opt in options" :key="opt.value ?? opt" :value="opt.value ?? opt">{{ opt.label ?? opt }}</option>
</select>
</div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue?: string | number; label?: string; options?: any[] }>();
const emit = defineEmits<{
	'update:modelValue': [value: string | number | undefined];
}>();

const model = computed({
	get: () => props.modelValue,
	set: (value: string | number | undefined) => emit('update:modelValue', value)
});
</script>
