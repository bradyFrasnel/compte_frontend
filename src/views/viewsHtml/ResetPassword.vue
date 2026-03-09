<template>
  <div class="reset-password-container">
    <div class="reset-password-content">
      <div class="image-section">
        <div class="image-overlay">
          <h2>Nouveau mot de passe</h2>
          <p>Configurez votre nouveau mot de passe sécurisé</p>
        </div>
      </div>
      <div class="form-section">
        <div class="reset-password-form card fade-in">
          <div class="form-header">
            <h2>Réinitialiser le mot de passe</h2>
            <p>Entrez le code reçu par email et votre nouveau mot de passe</p>
          </div>
          <form @submit.prevent="handleResetPassword" class="reset-password-form-content">
            <div class="form-group">
              <label for="token">Code de réinitialisation (6 chiffres)</label>
              <input
                type="text"
                id="token"
                v-model="form.token"
                required
                maxlength="6"
                pattern="[0-9]{6}"
                placeholder="123456"
                class="token-input"
                :disabled="loading"
              />
              <small class="form-hint">Le code que vous avez reçu par email de SharedVault</small>
            </div>
            <div class="form-group">
              <label for="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                v-model="form.newPassword"
                required
                minlength="6"
                placeholder="Entrez votre nouveau mot de passe"
                :disabled="loading"
              />
              <small class="form-hint">Minimum 6 caractères</small>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="confirmPassword"
                required
                minlength="6"
                placeholder="Confirmez votre nouveau mot de passe"
                :disabled="loading"
              />
              <div v-if="confirmPassword && form.newPassword !== confirmPassword" class="password-mismatch">
                ⚠️ Les mots de passe ne correspondent pas
              </div>
              <div v-else-if="confirmPassword && form.newPassword === confirmPassword" class="password-match">
                ✅ Les mots de passe correspondent
              </div>
            </div>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="loading || !isFormValid"
            >
              {{ loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe' }}
            </button>
            <p v-if="error" class="error">{{ error }}</p>
            <div v-if="success" class="success-container">
              <p class="success">{{ success }}</p>
              <p class="redirect-info">Vous allez être redirigé vers la page de connexion...</p>
            </div>
          </form>
          <div class="back-link">
            <p><router-link to="/login">← Retour à la connexion</router-link></p>
            <p><router-link to="/forgot-password">Renvoyer le code</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/axios'

const router = useRouter()

const form = ref({
  token: '',
  newPassword: ''
})

const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const isFormValid = computed(() => {
  return form.value.token.length === 6 && 
         form.value.newPassword.length >= 6 && 
         form.value.newPassword === confirmPassword.value
})

const handleResetPassword = async () => {
  if (!isFormValid.value) {
    error.value = 'Veuillez vérifier que tous les champs sont correctement remplis'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await api.post('/auth/reset-password', form.value)
    
    success.value = response.data.message
    
    // Rediriger vers la page de login après 2 secondes
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la réinitialisation'
  } finally {
    loading.value = false
  }
}
</script>

<style src="../viewsCss/ResetPassword.css"></style>
