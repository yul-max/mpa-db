<template>
  <div class="login-wrapper">
    <div class="login-form">
      <div class="login-form-title-wrapper">
        <div class="login-form-title">
          <div class="header-medium-3xl">Create Account</div>
          <div class="text-center">
            <span>Already have an account? </span>
            <router-link to="/login" class="clickable hoverable underline">Sign in</router-link>
          </div>
        </div>
      </div>
      <div class="login-form-body-wrapper">
        <Form
          :schema="signupSchema"
          :initialValues="initialValues"
          :fields="fields"
          submitLabel="Sign Up"
          @submit="handleSignUp"
          @error="handleSignUpError"
          buttonFill
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { reactive } from 'vue';
import Form from '@/components/ui/Form.vue';
import PasswordField from '@/components/ui/PasswordField.vue';

type SignupPayload = {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const signupSchema = z
  .object({
    name: z.string().superRefine((val, ctx) => {
      if (val.length > 0 && val.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full name must be at least 3 characters' });
      }
    }),
    email: z.string().superRefine((val, ctx) => {
      if (val.length > 0 && !z.string().email().safeParse(val).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address' });
      }
    }),
    username: z.string().superRefine((val, ctx) => {
      if (val.length > 0 && val.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username must be at least 3 characters' });
      }
    }),
    password: z.string(),
    confirmPassword: z.string()
  })
  .superRefine((data, ctx) => {
    const pw = data.password || '';
    if (pw.length > 0) {
      if (pw.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must be at least 8 characters' });
      }
      if (!/[A-Z]/.test(pw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must contain at least one uppercase letter' });
      }
      if (!/[a-z]/.test(pw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must contain at least one lowercase letter' });
      }
      if (!/[0-9]/.test(pw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must contain at least one number' });
      }
      if (!/[^A-Za-z0-9]/.test(pw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must contain at least one symbol' });
      }
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Passwords must match' });
    }
  });

const initialValues: SignupPayload = reactive({
  name: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
});

const fields: Array<{ name: string; label?: string; type?: 'text'|'password'|'select'|'checkbox'|'file'; placeholder?: string; validateOnBlur?: boolean; validateOnInput?: boolean; component?: unknown }> = [
  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', validateOnInput: true },
  { name: 'email', label: 'Email', type: 'text', placeholder: 'Enter your email address', validateOnInput: true },
  { name: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username', validateOnInput: true },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Create a password', validateOnInput: true, component: PasswordField },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password', validateOnInput: true }
];

const handleSignUp = (values: SignupPayload) => {
  console.log('Signup form submitted:', values);
  // TODO: call signup API, handle response
};

const handleSignUpError = (errors: Partial<Record<string, string>>) => {
  console.log('Signup validation errors:', errors);
};
</script>
