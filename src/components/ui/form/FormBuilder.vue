<template>
<form @submit.prevent="submitHandler">
<div v-for="field in schema" :key="field.name" class="mb-4" v-if="!isHidden(field)">
<component :is="resolve(field.type)" v-model="form[field.name]" v-bind="field.props" :label="field.label" :options="options[field.name]" :error="errors[field.name]" />
</div>
<div class="flex justify-end">
<slot name="actions"><button class="px-4 py-2 bg-blue-600 text-white rounded">Submit</button></slot>
</div>
</form>
</template>


<script setup lang="ts">
import { reactive, onMounted, toRefs } from 'vue';
import axios from 'axios';
import { fieldRegistry } from '@/form/registry';
import type { FormField } from '@/types/form';


const props = defineProps<{ schema: FormField[]; modelValue?: any; validator?: any }>();
const emit = defineEmits(['submit','update:modelValue']);
const form = reactive({ ...(props.modelValue || {}) });
const errors: Record<string,string> = reactive({});
const options: Record<string, any[]> = reactive({});


function resolve(type: string) { return fieldRegistry[type] || fieldRegistry['text']; }
function isHidden(field: FormField) { return typeof field.hidden === 'function' ? field.hidden(form) : field.hidden; }


async function loadOptions() {
for (const field of props.schema || []) {
if (field.data) options[field.name] = field.data;
if (field.source?.url) {
const url = field.source.url.replace(/\{(.*?)\}/g, (_,k)=> form[k] || '');
const resp = await axios.get(url);
options[field.name] = field.source.callback ? field.source.callback(resp.data) : resp.data;
}
}
}


async function validate() {
errorsClear();
if (props.validator) {
try { props.validator.parse(form); return true; } catch (e: any) { if (e?.errors) e.errors.forEach((err:any)=> { const p = err.path[0]; errors[p]=err.message }); return false; }
}
return true;
}


function errorsClear() { Object.keys(errors).forEach(k=> delete errors[k]); }


async function submitHandler() {
const ok = await validate();
if (!ok) return;
emit('submit', JSON.parse(JSON.stringify(form)));
}


onMounted(loadOptions);
</script>
