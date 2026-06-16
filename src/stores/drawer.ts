import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDrawerStore = defineStore('drawer', () => {
  const pin = ref({ isOpen: false, properties: null as any });
  const mpa = ref({ isOpen: false, properties: null as any });

  function openPin(properties: any) {
    pin.value.properties = properties;
    pin.value.isOpen = true;
  }
  function closePin() {
    pin.value.isOpen = false;
    pin.value.properties = null;
  }
function openMpa(properties: any) {
  const sanitized = Object.fromEntries(
    Object.entries(properties ?? {}).map(([key, value]) => [
      key,
      typeof value === 'string' && value === 'NULL' ? '-' : value
    ])
  );
  mpa.value.properties = sanitized;
  mpa.value.isOpen = true;
}

  function closeMpa() {
    mpa.value.isOpen = false;
    mpa.value.properties = null;
  }

  return { pin, mpa, openPin, closePin, openMpa, closeMpa };
});
