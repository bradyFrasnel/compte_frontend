<template>
  <div class="login-container">
    <div class="login-content">
      <div class="image-section">
        <div class="image-overlay">
          <h2>Bienvenue dans notre communauté</h2>
          <p>Gérez vos comptes en toute simplicité et sécurité</p>
        </div>
      </div>
      <div class="form-section">
        <div class="login-form card fade-in">
          <div class="form-header">
            <h2>Connexion</h2>
            <p>Bienvenue dans votre espace</p>
          </div>
          <form @submit.prevent="handleLogin" class="login-form-content">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                required
                placeholder="Entrez votre email"
              />
            </div>
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                required
                placeholder="Entrez votre mot de passe"
              />
            </div>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>
            <p v-if="error" class="error">{{ error }}</p>
          </form>
          <div class="register-link">
            <p>Pas de compte? <router-link to="/register">S'inscrire</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/auth/login', form.value)

    // Stocker le token JWT via le store
    authStore.setToken(response.data.access_token)

    // Rediriger vers le dashboard
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la connexion'
  } finally {
    loading.value = false
  }
}
</script>

<style src="../viewsCss/Login.css"></style>
