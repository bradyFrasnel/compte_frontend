<template>
  <div class="register-container">
    <div class="register-content">
      <div class="image-section">
        <div class="image-overlay">
          <h2>Bienvenue dans notre communauté</h2>
          <p>Gérez vos comptes en toute simplicité et sécurité</p>
        </div>
      </div>
      <div class="form-section">
        <div class="register-form card fade-in">
          <div class="form-header">
            <h2>Créer un compte</h2>
            <p>Rejoignez notre communauté</p>
          </div>
          <form @submit.prevent="handleRegister" class="register-form-content">
            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                v-model="form.username"
                required
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
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
                minlength="8"
              />
            </div>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Inscription...' : 'S\'inscrire' }}
            </button>
            <p v-if="error" class="error">{{ error }}</p>
            <p v-if="success" class="success">{{ success }}</p>
          </form>
          <div class="login-link">
            <p>Déjà un compte? <router-link to="/login">Se connecter</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const form = ref({
  username: '',
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await api.post('/auth/register', form.value)
    success.value = 'Compte créé avec succès! Redirection...'
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'inscription'
  } finally {
    loading.value = false
  }
}
</script>

<style src="../viewsCss/Register.css"></style>
