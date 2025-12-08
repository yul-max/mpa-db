import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/api/mpa'; // placeholder; replace with users API


export const useUsersStore = defineStore('users', () => {
  const list = ref<any[]>([]);


  async function fetchAll() { /* implement user list fetch */ }
  async function fetchById(id: string) { /* fetch single user */ return {}; }
  async function create(payload: any) { /* create user */ }
  async function update(id: string, payload: any) { /* update user */ }
  async function remove(id: string) { /* delete user */ }


  return { list, fetchAll, fetchById, create, update, remove };
});
