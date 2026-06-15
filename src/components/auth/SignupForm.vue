<template>
  <div class="">
    <div class="">
      <div class="">
        <div class="">
          <div class="header-medium-3xl">Create Account</div>
          <div class="text-center">
            <span>Already have an account? </span>
            <span class="clickable hoverable underline" @click="$emit('switch-to-login')"
              >Sign in</span
            >
          </div>
        </div>
      </div>
      <div class="login-form-body-wrapper">
        <Form
          ref="formRef"
          :schema="signupSchema"
          :initialValues="initialValues"
          :fields="fieldsConfig"
          submitLabel="Sign Up"
          cancelLabel="Close"
          :submit="handleSignUp"
          :onSuccess="onSuccess"
          @cancel="$emit('cancel')"
          @field-change="handleFieldChange"
          buttonFill
          clearOnCancel
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { reactive, computed, onMounted, ref } from 'vue'
import Form from '@/components/ui/Form.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import { createUser } from '@/api/authApi'
import type { SignupPayload } from '@/types/forms'
import type { FieldDef } from '@/types/form'
import { useOptionsStore, type ProvinceApiResponse, type MunicipalityApiResponse } from '@/stores/options'
import { useProvinceOptions, useMunicipalityOptions } from '@/composables/useDropdownOptions'

defineProps<{
  onSuccess?: () => void | Promise<void>
}>();

defineEmits(['switch-to-login', 'cancel'])

const optionsStore = useOptionsStore()
const formRef = ref<{ payload?: Record<string, unknown> } | null>(null)

// Get raw options from store
const provinces = computed(() => (optionsStore.options.provinces || []) as ProvinceApiResponse[])
const municipalities = computed(() => (optionsStore.options.municipalities || []) as MunicipalityApiResponse[])

// Transform to dropdown options
const provinceOptions = useProvinceOptions(provinces)

// Load options on mount
onMounted(async () => {
  await optionsStore.fetchOptions()
})

const signupSchema = z.object({
  first_name: z.string().superRefine((val, ctx) => {
    if (val.length > 0 && val.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Full name must be at least 3 characters',
      })
    }
  }),
  last_name: z.string().superRefine((val, ctx) => {
    if (val.length > 0 && val.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Full name must be at least 3 characters',
      })
    }
  }),
  email: z.string().superRefine((val, ctx) => {
    if (val.length > 0 && !z.string().email().safeParse(val).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address' })
    }
  }),
  user_name: z.string().superRefine((val, ctx) => {
    if (val.length > 0 && val.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username must be at least 3 characters',
      })
    }
  }),
  passwd: z.string(),
  confirmPassword: z.string(),
})
// .superRefine((data, ctx) => {
//   const pw = data.passwd || ''
//   if (pw.length > 0) {
//     if (pw.length < 8) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['password'],
//         message: 'Password must be at least 8 characters',
//       })
//     }
//     if (!/[A-Z]/.test(pw)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['password'],
//         message: 'Password must contain at least one uppercase letter',
//       })
//     }
//     if (!/[a-z]/.test(pw)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['password'],
//         message: 'Password must contain at least one lowercase letter',
//       })
//     }
//     if (!/[0-9]/.test(pw)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['password'],
//         message: 'Password must contain at least one number',
//       })
//     }
//     if (!/[^A-Za-z0-9]/.test(pw)) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['password'],
//         message: 'Password must contain at least one symbol',
//       })
//     }
//   }

//   if (data.passwd !== data.confirmPassword) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.custom,
//       path: ['confirmPassword'],
//       message: 'Passwords must match',
//     })
//   }
// })

const initialValues: SignupPayload = reactive({
  first_name: '',
  last_name: '',
  user_name: '',
  province: '',
  municipality: '',
  user_type: 1,
  email: '',
  username: '',
  passwd: '',
  confirmPassword: '',
})

// Track the currently selected province for municipality filtering
const selectedProvince = ref('')

const fieldsConfig = computed((): FieldDef[] => {
  // Find the province ID from the province name
  console.log('Computing fields config, province name:', selectedProvince.value)
  const province = provinces.value.find(p => p.name === selectedProvince.value)
  console.log('Found province:', province)
  const municipalityOpts = useMunicipalityOptions(municipalities, province?.id)
  console.log('Municipality options count:', municipalityOpts.value.length)

  return [
    {
      name: 'first_name',
      label: 'Given Name',
      type: 'text' as const,
      placeholder: 'Enter your given name',
      validateOnInput: true,
    },
    {
      name: 'last_name',
      label: 'Last Name',
      type: 'text' as const,
      placeholder: 'Enter your last name',
      validateOnInput: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'Enter your email address',
      validateOnInput: true,
    },
    {
      name: 'user_name',
      label: 'Username',
      type: 'text' as const,
      placeholder: 'Choose a username',
      validateOnInput: true,
    },
    {
      name: 'province',
      label: 'Province',
      type: 'select' as const,
      placeholder: 'Select province',
      validateOnInput: true,
      options: provinceOptions.value,
    },
    {
      name: 'municipality',
      label: 'Municipality',
      type: 'select' as const,
      placeholder: 'Select municipality',
      validateOnInput: true,
      options: municipalityOpts.value,
      props: {
        disabled: !selectedProvince.value,
      },
    },
    {
      name: 'user_type',
      label: 'User Type',
      type: 'text' as const,
      validateOnInput: true,
    },
    {
      name: 'passwd',
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Create a password',
      validateOnInput: true,
      component: PasswordField,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password' as const,
      placeholder: 'Confirm your password',
      validateOnInput: true,
    },
  ]
})

const handleFieldChange = (fieldName: string, value: unknown) => {
  console.log('Field changed:', fieldName, 'value:', value, 'type:', typeof value, 'length:', typeof value === 'string' ? value.length : 'N/A')
  if (fieldName === 'province') {
    selectedProvince.value = value as string
    console.log('Selected province updated to:', selectedProvince.value, 'isEmpty:', !selectedProvince.value)
    // Clear municipality when province changes
    if (formRef.value?.payload) {
      formRef.value.payload.municipality = ''
    }
  }
}

const handleSignUp = async (values: Record<string, unknown>) => {
  try {
    const result = await createUser(values as SignupPayload)
    return {
      success: result.success !== false,
      message: result.success !== false ? 'Account created successfully!' : result.message || 'Signup failed. Please try again.'
    }
  } catch (error) {
    console.error('Signup failed:', error)
    return {
      success: false,
      message: 'An error occurred. Please try again.'
    }
  }
}
</script>
