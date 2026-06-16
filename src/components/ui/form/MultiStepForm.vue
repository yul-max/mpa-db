<template>
<div>
<div class="mb-4">
<ol class="flex space-x-3 text-sm text-gray-600">
<li v-for="(s, i) in steps" :key="i" :class="{ 'font-bold': i===stepIndex }">{{ s.title }}</li>
</ol>
</div>


<FormBuilder :schema="currentFields" :validator="currentValidator" v-model="form" @submit="next">
<template #actions>
<div class="flex justify-between mt-4">
<button v-if="stepIndex>0" @click.prevent="prev" class="px-3 py-1 border rounded">Back</button>
<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">{{ stepIndex===steps.length-1 ? 'Finish' : 'Next' }}</button>
</div>
</template>
</FormBuilder>
</div>
</template>


<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import FormBuilder from './FormBuilder.vue';
import { getStepConfig } from '@/form/getStepConfig';


const props = defineProps<{ resource: string; mode: string; modelValue?: any }>();
const emit = defineEmits(['submit','update:modelValue']);


const { steps, stepSchemas, stepFieldDefs } = getStepConfig(props.resource, props.mode);
const form = reactive({ ...(props.modelValue || {}) });
const stepIndex = ref(0);
const currentFields = computed(() => stepFieldDefs[stepIndex.value] || []);
const currentValidator = computed(() => stepSchemas[stepIndex.value]);


function next() { if (stepIndex.value < steps.length -1) stepIndex.value++; else emit('submit', JSON.parse(JSON.stringify(form))); }
function prev() { if (stepIndex.value>0) stepIndex.value--; }
</script>
