import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchUsers, fetchUser, createUser, updateUser, deleteUser } from '@/api/users';

/**
 * Normalized users-store entity.
 * Note: backend payloads may include additional dynamic keys.
 */
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: number;
  [key: string]: any;
}

/**
 * Users store centralizes user CRUD and provides lookup helpers used by
 * details/list views to avoid repeated list scans.
 */
export const useUsersStore = defineStore('users', () => {
  const list = ref<User[]>([]);
  const loading = ref(false);

  // Create a lookup map for efficient user retrieval by ID
  const usersById = computed(() => {
    const map = new Map<number, User>();
    list.value.forEach(user => {
      // Support both 'id' and 'user_id' field names
      const userId = user.id || user.user_id;
      if (userId) {
        map.set(userId, user);
      }
    });
    return map;
  });

  /** Return display-ready full name from ID with fallback behavior. */
  function getUserFullName(id: number | string | null | undefined): string {
    if (!id) return 'N/A';
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    const user = usersById.value.get(userId);
    if (!user) return 'N/A';
    return `${user.first_name} ${user.last_name}`.trim() || user.email || 'N/A';
  }

  /** Retrieve a cached user by ID. */
  function getUserById(id: number | string | null | undefined): User | null {
    if (!id) return null;
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    return usersById.value.get(userId) || null;
  }

  /** Fetch and normalize all users into list cache. */
  async function fetchAll() {
    loading.value = true;
    try {
      const response = await fetchUsers({});
      // Handle different response structures
      if (response.data?.rows) {
        list.value = response.data.rows;
      } else if (Array.isArray(response.data)) {
        list.value = response.data;
      } else {
        list.value = [];
      }
      return list.value;
    } catch (error) {
      console.error('Error fetching users:', error);
      list.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  /** Fetch a single user record from API. */
  async function fetchById(id: string | number) {
    try {
      const response = await fetchUser(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /** Create user then refresh cache. */
  async function create(payload: any) {
    try {
      const response = await createUser(payload);
      await fetchAll(); // Refresh list
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /** Update user then refresh cache. */
  async function update(id: string | number, payload: any) {
    try {
      const response = await updateUser(id, payload);
      await fetchAll(); // Refresh list
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /** Delete user then refresh cache. */
  async function remove(id: string | number) {
    try {
      const response = await deleteUser(id);
      await fetchAll(); // Refresh list
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  return {
    list,
    loading,
    usersById,
    getUserFullName,
    getUserById,
    fetchAll,
    fetchById,
    create,
    update,
    remove
  };
});
