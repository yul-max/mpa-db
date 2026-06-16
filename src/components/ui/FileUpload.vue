<template>
<div>
<label class="block text-sm font-medium mb-1">{{ label }}</label>
<input type="file" @change="onFile" :multiple="multiple" />
</div>
</template>
<script setup lang="ts">
defineProps({ modelValue: Array, label: String, multiple: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue']);
function onFile(e: any) { const files = Array.from(e.target.files || []); emit('update:modelValue', files); }
</script>
