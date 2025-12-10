<template>
    <div class="login-wrapper">
        <div class="login-form">
            <div class="login-form-title-wrapper">
                <div class="login-form-title">
                    <div class="header-medium-3xl">Welcome Back</div>
                    <div class="text-center">
                        <span>Don't have an account? </span>
                        <a class="clickable hoverable underline">Sign up</a>
                    </div>
                </div>
            </div>
            <div class="login-form-body-wrapper">
                <Form
                  :schema="loginSchema"
                  :initialValues="initialValues"
                  :fields="fields"
                  submitLabel="Sign In"
                  @submit="handleSignIn"
                  @error="handleSignInError"
                  buttonFill
                />
            </div>
            <a class="clickable hoverable-white">Forgot Password?</a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { type LoginFormPayload } from '@/types/formPayloads';
import Form from '@/components/ui/Form.vue';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const initialValues: LoginFormPayload = {
  username: '',
  password: ''
};

const fields: Array<{ name: string; label?: string; type?: 'text'|'password'|'select'|'checkbox'|'file'; placeholder?: string }> = [
  { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter password' }
];

const handleSignIn = (values: LoginFormPayload) => {
  console.log('Form submitted:', values);
  // TODO: call API, set auth state, navigate
};

const handleSignInError = (errors: Partial<Record<keyof LoginFormPayload, string>>) => {
  console.log('Validation errors:', errors);
};
</script>
