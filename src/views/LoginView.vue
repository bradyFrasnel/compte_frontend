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
import api from '../api/axios'
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

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--jade-green) 0%, var(--nature-green) 100%);
}

.login-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  align-items: stretch;
}

.image-section {
  position: relative;
  background: url('/src/assets/images/comptabilite.jpg') center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 107, 68, 0.8) 0%, rgba(34, 139, 34, 0.8) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--white);
  text-align: center;
  padding: 2rem;
}

.image-overlay h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.image-overlay p {
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
  max-width: 400px;
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--gray-50);
}

.login-form {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--gray-900);
  font-size: 1.875rem;
  font-weight: 700;
}

.form-header p {
  margin: 0;
  color: var(--gray-500);
  font-size: 1rem;
}

.login-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: var(--gray-700);
  font-weight: 600;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
}

.register-link {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

.register-link p {
  margin: 0;
  color: var(--gray-600);
  font-size: 0.875rem;
}

.register-link a {
  color: var(--navy-blue);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.register-link a:hover {
  color: var(--navy-blue-light);
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .image-overlay h2 {
    font-size: 2rem;
  }
  
  .image-overlay p {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .login-content {
    grid-template-columns: 1fr;
  }
  
  .image-section {
    min-height: 300px;
  }
  
  .image-overlay h2 {
    font-size: 1.75rem;
  }
  
  .image-overlay p {
    font-size: 0.875rem;
  }
  
  .form-section {
    padding: 1.5rem;
  }
  
  .login-form {
    max-width: 100%;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
  
  .login-form-content {
    gap: 1.25rem;
  }
}

@media (max-width: 640px) {
  .image-section {
    min-height: 250px;
  }
  
  .image-overlay {
    padding: 1.5rem;
  }
  
  .image-overlay h2 {
    font-size: 1.5rem;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .form-header {
    margin-bottom: 1.5rem;
  }
  
  .form-header h2 {
    font-size: 1.375rem;
  }
  
  .form-header p {
    font-size: 0.875rem;
  }
  
  .login-form-content {
    gap: 1rem;
  }
  
  .register-link {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }
}

@media (max-width: 480px) {
  .image-section {
    min-height: 200px;
  }
  
  .image-overlay {
    padding: 1rem;
  }
  
  .image-overlay h2 {
    font-size: 1.25rem;
  }
  
  .image-overlay p {
    font-size: 0.75rem;
  }
  
  .form-section {
    padding: 0.75rem;
  }
  
  .login-form-content {
    gap: 0.875rem;
  }
}

@media (max-height: 700px) {
  .login-container {
    min-height: auto;
  }
  
  .login-content {
    min-height: auto;
  }
  
  .image-section {
    min-height: 200px;
  }
}
</style>
