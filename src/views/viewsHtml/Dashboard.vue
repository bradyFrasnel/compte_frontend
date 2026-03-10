<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1><center><img src="/src/assets/logos/logo_fai.png" alt="Logo" class="header-logo"><a href="https://shabfai-6a53f.web.app/admin">shabaFAI</a></center></h1>      
      <div class="user-info">
        <button @click="showProfileModal = true" class="profile-icon-btn" title="Profil">
          <span class="profile-icon">👤</span>
        </button>
        <button @click="logout" class="logout-icon-btn" title="Déconnexion">
          <span class="logout-icon">🚪</span>
        </button>
      </div>
    </header>

    <main class="dashboard-main">
      <section class="balance-section">
        <div class="balance-card">
          <h2>Cours des comptes</h2>
          <div class="balance-amount">{{ formatCurrency(balance) }}</div>
        </div>
      </section>

      <section class="actions-section">
        <div class="action-card">
          <h3>Déposer des fonds</h3>
          <form @submit.prevent="handleDeposit" class="deposit-form">
            <div class="form-group">
              <label for="amount">Montant</label>
              <input
                type="number"
                id="amount"
                v-model.number="depositForm.amount"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                class="form-input"
              />
            </div>
            <button type="submit" class="btn-primary" :disabled="depositLoading">
              {{ depositLoading ? 'Dépôt en cours...' : 'Déposer' }}
            </button>
            <p v-if="depositError" class="error">{{ depositError }}</p>
            <p v-if="depositSuccess" class="success">{{ depositSuccess }}</p>
          </form>
        </div>

        <div v-if="user?.role === 'ADMIN'" class="action-card admin-card">
          <h3>Actions Administrateur</h3>
          <div class="admin-actions">
            <button @click="showWithdrawModal = true" class="admin-btn withdraw">
              Effectuer un retrait
            </button>
          </div>
        </div>
      </section>

      <!-- Système d'onglets pour les transactions -->
      <section class="transactions-section">
        <h2>Gestion des Transactions</h2>
        
        <!-- Navigation par onglets -->
        <div class="tabs-navigation">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count">({{ getTransactionCount(tab.id) }})</span>
          </button>
        </div>

        <!-- Contenu des onglets -->
        <div class="tabs-content">
          <!-- Onglet En Attente -->
          <div v-if="activeTab === 'pending'" class="tab-content">
            <div class="tab-header">
              <h3>Transactions en attente de validation</h3>
              <p>Ces transactions nécessitent votre approbation</p>
            </div>
            <div v-if="pendingTransactions.length === 0" class="empty-state">
              <p>Aucune transaction en attente</p>
            </div>
            <div v-else class="transactions-list">
              <div
                v-for="transaction in pendingTransactions"
                :key="transaction.id"
                class="transaction-item pending"
              >
                <div class="transaction-info">
                  <span class="transaction-type">
                    <span class="user-name">{{ transaction.user?.username || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status pending">PENDING</span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
                <div v-if="user?.role === 'ADMIN'" class="transaction-actions">
                  <button @click="validateTransaction(transaction.id, 'APPROVED')" class="approve-btn">
                    Approuver
                  </button>
                  <button @click="validateTransaction(transaction.id, 'REJECTED')" class="reject-btn">
                    Rejeter
                  </button>
                  <button @click="editTransaction(transaction)" class="edit-btn">
                    Modifier
                  </button>
                  <button @click="deleteTransaction(transaction.id)" class="delete-btn">
                    Supprimer
                  </button>
                </div>
                <div v-else-if="transaction.userId === user?.id" class="transaction-actions">
                  <button @click="editTransaction(transaction)" class="edit-btn">
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Approuvées -->
          <div v-if="activeTab === 'approved'" class="tab-content">
            <div class="tab-header">
              <h3>Transactions approuvées</h3>
              <p>Ces transactions ont été traitées et validées</p>
            </div>
            <div v-if="approvedTransactions.length === 0" class="empty-state">
              <p>Aucune transaction approuvée</p>
            </div>
            <div v-else class="transactions-list">
              <div
                v-for="transaction in approvedTransactions"
                :key="transaction.id"
                class="transaction-item approved"
              >
                <div class="transaction-info">
                  <span class="transaction-type">
                    <span class="user-name">{{ transaction.user?.username || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                  <span class="transaction-message" v-if="transaction.justification">
                    Pour cause de : {{ transaction.justification }}
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status approved">APPROVED</span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Rejetées -->
          <div v-if="activeTab === 'rejected'" class="tab-content">
            <div class="tab-header">
              <h3>Transactions rejetées</h3>
              <p>Ces transactions ont été traitées et refusées</p>
            </div>
            <div v-if="rejectedTransactions.length === 0" class="empty-state">
              <p>Aucune transaction rejetée</p>
            </div>
            <div v-else class="transactions-list">
              <div
                v-for="transaction in rejectedTransactions"
                :key="transaction.id"
                class="transaction-item rejected"
              >
                <div class="transaction-info">
                  <span class="transaction-type">
                    <span class="user-name">{{ transaction.user?.username || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                  <span class="transaction-message" v-if="transaction.justification">
                    Pour cause de : {{ transaction.justification }}
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status rejected">REJECTED</span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Retraits -->
          <div v-if="activeTab === 'withdrawals'" class="tab-content">
            <div class="tab-header">
              <h3>Historique des retraits</h3>
              <p>Tous les retraits effectués sur le compte</p>
            </div>
            <div v-if="allWithdrawals.length === 0" class="empty-state">
              <p>Aucun retrait effectué</p>
            </div>
            <div v-else class="transactions-list">
              <div
                v-for="transaction in allWithdrawals"
                :key="transaction.id"
                :class="['transaction-item', transaction.status.toLowerCase()]"
              >
                <div class="transaction-info">
                  <span class="transaction-type">
                    <span class="user-name">{{ transaction.user?.username || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">retrait</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                  <span class="transaction-message" v-if="transaction.justification">
                    Pour cause de : {{ transaction.justification }}
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modales -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="showWithdrawModal = false">
      <div class="modal" @click.stop>
        <h3>Effectuer un retrait</h3>
        <form @submit.prevent="handleWithdraw">
          <div class="form-group">
            <label for="withdrawAmount">Montant</label>
            <input
              type="number"
              id="withdrawAmount"
              v-model.number="withdrawForm.amount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label for="withdrawJustification">Notifier</label>
            <textarea
              id="withdrawJustification"
              v-model="withdrawForm.justification"
              required
              rows="3"
              placeholder="pourquoi vous voulez faire ce retrait ??"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showWithdrawModal = false">Annuler</button>
            <button type="submit" :disabled="withdrawLoading">
              {{ withdrawLoading ? 'Retrait...' : 'Retirer' }}
            </button>
          </div>
          <p v-if="withdrawError" class="error">{{ withdrawError }}</p>
        </form>
      </div>
    </div>

  <!-- Modal d'édition de transaction -->
  <div v-if="showEditModal" class="modal-overlay">
    <div class="modal">
      <h3>Modifier la transaction</h3>
      <form @submit.prevent="saveTransactionEdit">
        <div class="form-group">
          <label for="edit-amount">Nouveau montant (FCFA)</label>
          <input
            id="edit-amount"
            v-model="editAmount"
            type="number"
            step="0.01"
            min="0"
            required
            class="form-input"
          />
        </div>
        <div class="modal-actions">
          <button type="button" @click="cancelEdit" class="cancel-btn">
            Annuler
          </button>
          <button type="submit" class="save-btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

  <!-- Modal de profil utilisateur -->
  <div v-if="showProfileModal" class="modal-overlay" @click="showProfileModal = false">
    <div class="modal profile-modal" @click.stop>
      <div class="profile-header">
        <div class="profile-avatar">
          <span class="profile-avatar-icon">👤</span>
        </div>
        <h3>Profil Utilisateur</h3>
      </div>
      <div class="profile-content">
        <div class="profile-info">
          <div class="info-item">
            <label>Nom d'utilisateur:</label>
            <span>{{ user?.username }}</span>
          </div>
          <div class="info-item">
            <label>Email:</label>
            <span>{{ user?.email }}</span>
          </div>
          <div class="info-item">
            <label>Rôle:</label>
            <span class="role-badge" :class="user?.role?.toLowerCase()">
              {{ user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur' }}
            </span>
          </div>
          <div class="info-item">
            <label>ID:</label>
            <span>{{ user?.id }}</span>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" @click="showProfileModal = false" class="close-btn">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/axios'
import { useAuthStore } from '@/stores/auth'

interface Transaction {
  id: string
  amount: number
  type: 'DEPOT' | 'RETRAIT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  userId: string
  user?: {
    username: string
    email: string
    role: string
  }
  justification?: string
}

const router = useRouter()
const authStore = useAuthStore()

const balance = ref(0)
const transactions = ref<Transaction[]>([])

const pendingTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'PENDING')
})

const approvedTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'APPROVED' && t.type === 'DEPOT')
})

const rejectedTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'REJECTED')
})

const allWithdrawals = computed(() => {
  return transactions.value.filter(t => t.type === 'RETRAIT')
})

const depositForm = ref({ amount: 0 })
const withdrawForm = ref({ amount: 0, justification: '' })

const depositLoading = ref(false)
const withdrawLoading = ref(false)

const depositError = ref('')
const withdrawError = ref('')
const depositSuccess = ref('')

const user = computed(() => authStore.user)

// Système d'onglets
const activeTab = ref('pending')

const tabs = [
  { id: 'pending', label: 'En attente'},
  { id: 'approved', label: 'Approuvées'},
  { id: 'rejected', label: 'Rejetées'},
  { id: 'withdrawals', label: 'Retraits'}
]

const getTransactionCount = (tabId: string) => {
  switch (tabId) {
    case 'pending':
      return pendingTransactions.value.length
    case 'approved':
      return approvedTransactions.value.length
    case 'rejected':
      return rejectedTransactions.value.length
    case 'withdrawals':
      return allWithdrawals.value.length
    default:
      return 0
  }
}

const showWithdrawModal = ref(false)

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadUserData = async () => {
  try {
    if (!authStore.token) {
      logout()
      return
    }
    // Récupérer l'utilisateur connecté
    const userResponse = await api.get('/users/data')
    authStore.user = userResponse.data

    // Récupérer les transactions
    const transactionsResponse = await api.get('/transactions/all')
    transactions.value = transactionsResponse.data

    // Récupérer le solde depuis le backend
    const balanceResponse = await api.get('/transactions/balance')
    balance.value = balanceResponse.data.balance
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    logout()
  }
}

const handleDeposit = async () => {
  depositLoading.value = true
  depositError.value = ''
  depositSuccess.value = ''

  try {
    await api.post('/transactions/deposit', {
      amount: depositForm.value.amount
    })

    depositSuccess.value = 'Dépôt soumis avec succès!'
    depositForm.value.amount = 0
    
    // Recharger les données
    await loadUserData()
  } catch (err: any) {
    depositError.value = err.response?.data?.message || 'Erreur lors du dépôt'
  } finally {
    depositLoading.value = false
  }
}

const handleWithdraw = async () => {
  withdrawLoading.value = true
  withdrawError.value = ''

  try {
    await api.post('/transactions/admin/withdraw-with-justification', {
      amount: withdrawForm.value.amount,
      justification: withdrawForm.value.justification
    })

    showWithdrawModal.value = false
    withdrawForm.value.amount = 0
    withdrawForm.value.justification = ''
    
    // Recharger les données
    await loadUserData()
  } catch (err: any) {
    withdrawError.value = err.response?.data?.message || 'Erreur lors du retrait'
  } finally {
    withdrawLoading.value = false
  }
}

const validateTransaction = async (transactionId: string, status: 'APPROVED' | 'REJECTED') => {
  try {
    console.log('Tentative de validation:', { transactionId, status, userRole: user.value?.role })
    await api.patch(`/transactions/admin/validate/${transactionId}`, {
      status,
      justification: `Validation par administrateur: ${status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}`
    })
    // Recharger les transactions
    await loadUserData()
  } catch (err: any) {
    console.error('Erreur validation transaction:', err)
    if (err.response?.status === 403) {
      alert('Erreur: Vous n\'avez pas les droits administrateur pour valider cette transaction.')
    }
  }
}

const deleteTransaction = async (transactionId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.')) {
    return
  }
  
  try {
    await api.delete(`/transactions/admin/delete/${transactionId}`)
    // Recharger les transactions
    await loadUserData()
  } catch (err: any) {
    console.error('Erreur suppression transaction:', err)
    if (err.response?.status === 403) {
      alert('Erreur: Vous n\'avez pas les droits administrateur pour supprimer cette transaction.')
    } else {
      alert('Erreur lors de la suppression de la transaction.')
    }
  }
}

const updateTransactionAmount = async (transactionId: string, newAmount: number) => {
  try {
    const isAdmin = user.value?.role === 'ADMIN'
    const endpoint = isAdmin
      ? `/transactions/admin/update/${transactionId}`
      : `/transactions/update/${transactionId}`

    await api.patch(endpoint, {
      amount: newAmount
    })
    // Recharger les transactions
    await loadUserData()
    // Fermer le modal
    showEditModal.value = false
    editingTransaction.value = null
  } catch (err: any) {
    console.error('Erreur mise à jour transaction:', err)
  }
}

const showEditModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const editAmount = ref('')
const editJustification = ref('')
const showProfileModal = ref(false)

const editTransaction = (transaction: Transaction) => {
  editingTransaction.value = transaction
  editAmount.value = transaction.amount.toString()
  editJustification.value = ''
  showEditModal.value = true
}

const saveTransactionEdit = () => {
  if (editingTransaction.value && editAmount.value) {
    const newAmount = parseFloat(editAmount.value)
    if (newAmount > 0) {
      updateTransactionAmount(editingTransaction.value.id, newAmount)
    }
  }
}

const cancelEdit = () => {
  showEditModal.value = false
  editingTransaction.value = null
  editAmount.value = ''
  editJustification.value = ''
}
/*
const getUsername = (transaction: Transaction) => {
  // Priorité pour username direct depuis l'objet user pour retourner le username de l'utilisateur
  if (transaction.user?.username) {
    return transaction.user.username
  }
  
  // Priorité pour username de l'utilisateur courant si c'est sa transaction
  if (transaction.userId === user.value?.id && user.value?.username) {
    return user.value.username
  }
  
  // Fallback: ID utilisateur
  return `User-${transaction.userId?.slice(0, 8) || 'Inconnu'}`
}
*/

const logout = () => {
  authStore.clear()
  router.push('/login')
}

onMounted(() => {
  loadUserData()
})
</script>

<style src="../viewsCss/Dashboard.css"></style>
