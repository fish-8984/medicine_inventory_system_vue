import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const setToken = (newToken) => {
    token.value = newToken
  }
  const removeToken = () => {
    token.value = ''
  }


  const name = ref('')
  const setName = (newName) => {
    name.value = newName
  }
  const getName = () => {
    return name.value
  }
  const removeName = () => {
    name.value = ''
  }
  return { token, setToken, removeToken, name, setName, getName, removeName }
}, {
  persist: true
})
