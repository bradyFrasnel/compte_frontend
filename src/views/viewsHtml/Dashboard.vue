<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1><button class="shabaFAI"><img src="/src/assets/logos/logo_fai.png" alt="Logo" class="header-logo"><a href="https://shabfai-6a53f.web.app/admin">shabaFAI</a></button> vous souhaite la Bienvenue</h1>      
      <div class="user-info">
        <span class="username">{{ user?.username }}</span>
        <button @click="logout" class="logout-btn">Déconnexion</button>
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
              />
            </div>
            <button type="submit" :disabled="depositLoading">
              {{ depositLoading ? 'Dépôt...' : 'Déposer' }}
            </button>
            <p v-if="depositError" class="error">{{ depositError }}</p>
            <p v-if="depositSuccess" class="success">{{ depositSuccess }}</p>
          </form>
        </div>

        <div v-if="user?.role === 'ADMIN'" class="action-card admin-card">
          <h3>Administration</h3>
          <div class="admin-actions">
            <button @click="showWithdrawModal = true" class="admin-btn withdraw">
              Effectuer un retrait
            </button>
          </div>
        </div>
      </section>

      <section v-if="transactions.length > 0" class="transactions-section">
        <h2>Historique des transactions</h2>
        
        <!-- Transactions en attente - Haut -->
        <div v-if="pendingTransactions.length > 0" class="transaction-group">
          <h3 class="group-title pending-title">
            <span class="icon">⏳</span>
            En attente ({{ pendingTransactions.length }})
          </h3>
          
          <!-- Dépôts en attente -->
          <div v-if="pendingDeposits.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title deposit-title">
              <span class="icon">💰</span>
              Dépôts en attente ({{ pendingDeposits.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in pendingDeposits"
                :key="transaction.id"
              >
                <div class="transaction-item pending">
                  <div class="transaction-info">
                    <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                  </div>
                  <div class="status-container">
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
          </div>

          <!-- Retraits en attente -->
          <div v-if="pendingWithdrawals.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title withdrawal-title">
              <span class="icon">💸</span>
              Retraits en attente ({{ pendingWithdrawals.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in pendingWithdrawals"
                :key="transaction.id"
              >
                <div class="transaction-item pending">
                  <div class="transaction-info">
                    <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                  </div>
                  <div class="status-container">
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
          </div>
        </div>

        <!-- Transactions approuvées - Milieu -->
        <div v-if="approvedTransactions.length > 0" class="transaction-group">
          <h3 class="group-title approved-title">
            <span class="icon">✅</span>
            Approuvées ({{ approvedTransactions.length }})
          </h3>
          
          <!-- Dépôts approuvés -->
          <div v-if="approvedDeposits.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title deposit-title">
              <span class="icon">💰</span>
              Dépôts approuvés ({{ approvedDeposits.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in approvedDeposits"
                :key="transaction.id"
                class="transaction-item approved"
              >
                <div class="transaction-info">
                  <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span> d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status approved">APPROVED</span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Retraits approuvés -->
          <div v-if="approvedWithdrawals.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title withdrawal-title">
              <span class="icon">💸</span>
              Retraits ({{ approvedWithdrawals.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in approvedWithdrawals"
                :key="transaction.id"
                class="transaction-item approved"
              >
                <div class="transaction-info">
                  <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
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
        </div>

        <!-- Transactions rejetées - Bas -->
        <div v-if="rejectedTransactions.length > 0" class="transaction-group">
          <h3 class="group-title rejected-title">
            <span class="icon">❌</span>
            Rejetées ({{ rejectedTransactions.length }})
          </h3>
          
          <!-- Dépôts rejetés -->
          <div v-if="rejectedDeposits.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title deposit-title">
              <span class="icon">💰</span>
              Dépôts rejetés ({{ rejectedDeposits.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in rejectedDeposits"
                :key="transaction.id"
                class="transaction-item rejected"
              >
                <div class="transaction-info">
                  <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
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

          <!-- Retraits rejetés -->
          <div v-if="rejectedWithdrawals.length > 0" class="transaction-subgroup">
            <h4 class="subgroup-title withdrawal-title">
              <span class="icon">💸</span>
              Retraits rejetés ({{ rejectedWithdrawals.length }})
            </h4>
            <div class="transactions-list">
              <div
                v-for="transaction in rejectedWithdrawals"
                :key="transaction.id"
                class="transaction-item rejected"
              >
                <div class="transaction-info">
                  <span class="transaction-type"><span class="user-name">{{ transaction.user?.email?.split('@')[0] || 'Utilisateur inconnu' }}</span> 
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
        </div>
      </section>

      <!-- Message si aucune transaction -->
      <div v-if="transactions.length === 0" class="no-transactions">
        <p>Aucune transaction pour le moment</p>
      </div>
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
    email: string
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

const pendingDeposits = computed(() => {
  return pendingTransactions.value.filter(t => t.type === 'DEPOT')
})

const pendingWithdrawals = computed(() => {
  return pendingTransactions.value.filter(t => t.type === 'RETRAIT')
})

const approvedTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'APPROVED')
})

const approvedDeposits = computed(() => {
  return approvedTransactions.value.filter(t => t.type === 'DEPOT')
})

const approvedWithdrawals = computed(() => {
  return approvedTransactions.value.filter(t => t.type === 'RETRAIT')
})

const rejectedTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'REJECTED')
})

const rejectedDeposits = computed(() => {
  return rejectedTransactions.value.filter(t => t.type === 'DEPOT')
})

const rejectedWithdrawals = computed(() => {
  return rejectedTransactions.value.filter(t => t.type === 'RETRAIT')
})

const depositForm = ref({ amount: 0 })
const withdrawForm = ref({ amount: 0, justification: '' })

const depositLoading = ref(false)
const withdrawLoading = ref(false)

const depositError = ref('')
const withdrawError = ref('')
const depositSuccess = ref('')

const user = computed(() => authStore.user)

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
    await api.patch(`/transactions/update/${transactionId}`, {
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

const logout = () => {
  authStore.clear()
  router.push('/login')
}

onMounted(() => {
  loadUserData()
})
</script>

<style src="../viewsCss/Dashboard.css"></style>
