<template>
<form @submit.prevent="submitHandler">
<div v-for="(field, idx) in visibleSchema" :key="idx" class="mb-4">
<component :is="resolve(field.type)" v-model="form[field.name]" v-bind="field.props" :label="field.label" :options="options[field.name]" :error="errors[field.name]" />
</div>
<div class="flex justify-end">
<slot name="actions"><button class="px-4 py-2 bg-blue-600 text-white rounded">Submit</button></slot>
</div>
</form>
</template>


<script setup lang="ts">
import { reactive, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { fieldRegistry } from '@/form/registry';
import type { FormField } from '@/types/forms';

const props = defineProps<{ schema: FormField[]; modelValue?: any; validator?: any }>();
const schema = props.schema;
const visibleSchema = computed(() => (schema || []).filter((f: FormField) => !isHidden(f)));
const emit = defineEmits(['submit', 'update:modelValue']);
const form = reactive({ ...(props.modelValue || {}) });

watch(
  form,
  () => emit('update:modelValue', JSON.parse(JSON.stringify(form))),
  { deep: true }
);

const errors: Record<string, string> = reactive({});
const options: Record<string, any[]> = reactive({});

function resolve(type: string) { return fieldRegistry[type] || fieldRegistry['text']; }
function isHidden(field: FormField) { return typeof field.hidden === 'function' ? field.hidden(form) : field.hidden; }


async function loadOptions() {
for (const field of props.schema || []) {
if (field.data) options[field.name] = field.data;
if (field.source?.url) {
const url = field.source.url.replace(/\{(.*?)\}/g, (_: string, k: string)=> form[k] || '');
const resp = await axios.get(url);
options[field.name] = field.source.callback ? field.source.callback(resp.data) : resp.data;
}
}
}


async function validate() {
  errorsClear();
  if (!props.validator) return true;

  try {
    props.validator.parse(form);
    return true;
  } catch (e: any) {
    const issues = e?.issues ?? e?.errors ?? [];
    issues.forEach((err: any) => {
      const p = err.path?.[0];
      if (p != null) errors[p] = err.message;
    });
    return false;
  }
}


function errorsClear() { Object.keys(errors).forEach(k=> delete errors[k]); }


async function submitHandler() {
const ok = await validate();
if (!ok) return;
emit('submit', JSON.parse(JSON.stringify(form)));
}


onMounted(loadOptions);
</script>
