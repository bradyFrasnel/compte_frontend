<template>
  <div class="forgot-password-container">
    <div class="forgot-password-content">
      <div class="image-section">
        <div class="image-overlay">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Nous vous aiderons à récupérer l'accès à votre compte</p>
        </div>
      </div>
      <div class="form-section">
        <div class="forgot-password-form card fade-in">
          <div class="form-header">
            <h2>Mot de passe oublié?</h2>
            <p>Entrez votre email pour recevoir un code de réinitialisation par email</p>
          </div>
          <form @submit.prevent="handleForgotPassword" class="forgot-password-form-content">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                required
                placeholder="votre@email.com"
                :disabled="loading"
              />
            </div>
            <button type="submit" class="btn-primary" :disabled="loading || !form.email">
              {{ loading ? 'Envoi en cours...' : 'Envoyer le code par email' }}
            </button>
            <p v-if="error" class="error">{{ error }}</p>
            <div v-if="success" class="success-container">
              <p class="success">{{ success }}</p>
              <div v-if="token" class="token-info">
                <p><strong>Code de développement (visible uniquement en mode test) :</strong></p>
                <div class="token-display">{{ token }}</div>
                <p class="token-instruction">Ce code est valide pendant 1 heure</p>
              </div>
              <div class="email-instructions">
                <h4>📧 Instructions :</h4>
                <ul>
                  <li>Consultez votre boîte de réception</li>
                  <li>Vérifiez le dossier "Spams" ou "Indésirables"</li>
                  <li>Recherchez un email de "SharedVault"</li>
                  <li>Le code apparaît en gros et en bleu dans l'email</li>
                </ul>
              </div>
            </div>
          </form>
          <div class="back-link">
            <p><router-link to="/login">← Retour à la connexion</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api/axios'

const form = ref({
  email: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const token = ref('')

const handleForgotPassword = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  token.value = ''

  try {
    const response = await api.post('/auth/forgot-password', form.value)
    
    success.value = response.data.message
    
    // En développement, afficher le token pour les tests
    if (response.data.token) {
      token.value = response.data.token
    }
    
    // Ne plus rediriger automatiquement, laisser l'utilisateur consulter son email
    // setTimeout(() => {
    //   router.push('/reset-password')
    // }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email'
  } finally {
    loading.value = false
  }
}
</script>

<style src="../viewsCss/ForgotPassword.css"></style>
