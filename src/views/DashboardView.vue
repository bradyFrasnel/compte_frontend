<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Tableau de bord</h1>
      <div class="user-info">
        <span>Bienvenue, {{ user?.username }}</span>
        <button @click="logout" class="logout-btn">Déconnexion</button>
      </div>
    </header>

    <main class="dashboard-main">
      <section class="balance-section">
        <div class="balance-card">
          <h2>Solde total</h2>
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

      <section v-if="user?.role === 'ADMIN' && pendingTransactions.length > 0" class="moderation-section">
        <h2>Transactions en attente</h2>
        <div class="transactions-list">
          <div
            v-for="transaction in pendingTransactions"
            :key="transaction.id"
            class="transaction-item pending"
          >
            <div class="transaction-info">
              <span class="transaction-type">{{ transaction.type }}</span>
              <span class="transaction-user" v-if="transaction.user?.email">({{ transaction.user.email }})</span>
              <span class="transaction-amount" :class="transaction.type.toLowerCase()">
                {{ transaction.type === 'RETRAIT' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
              </span>
            </div>
            <div class="transaction-meta">
              <span class="transaction-status pending">PENDING</span>
              <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
            </div>
            <div class="transaction-actions">
              <button @click="validateTransaction(transaction.id, 'APPROVED')" class="approve-btn">
                Approuver
              </button>
              <button @click="validateTransaction(transaction.id, 'REJECTED')" class="reject-btn">
                Rejeter
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="transactions-section">
        <h2>Historique complet</h2>
        <div v-if="completedTransactions.length === 0" class="no-data">
          Aucune transaction validée pour le moment.
        </div>
        <div v-else class="transactions-list">
          <div
            v-for="transaction in completedTransactions"
            :key="transaction.id"
            class="transaction-item"
            :class="transaction.status.toLowerCase()"
          >
            <div class="transaction-info">
              <span class="transaction-type">{{ transaction.type }}</span>
              <span class="transaction-user" v-if="transaction.user?.email">({{ transaction.user.email }})</span>
              <span class="transaction-amount" :class="transaction.type.toLowerCase()">
                {{ transaction.type === 'RETRAIT' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
              </span>
            </div>
            <div class="transaction-meta">
              <span class="transaction-status" :class="transaction.status.toLowerCase()">
                {{ transaction.status }}
              </span>
              <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
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
    role: string
  }
}

const router = useRouter()
const authStore = useAuthStore()

const balance = ref(0)
const transactions = ref<Transaction[]>([])

const pendingTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'PENDING')
})

const completedTransactions = computed(() => {
  return transactions.value.filter(t => t.status !== 'PENDING')
})

const depositForm = ref({ amount: 0 })
const withdrawForm = ref({ amount: 0 })

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
    currency: 'EUR'
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
    await api.post('/transactions/admin/withdraw', {
      amount: withdrawForm.value.amount
    })

    showWithdrawModal.value = false
    withdrawForm.value.amount = 0
    
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
    await api.patch(`/transactions/admin/validate/${transactionId}`, {
      status
    })

    // Recharger les données
    await loadUserData()
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
  }
}

const logout = () => {
  authStore.clear()
  router.push('/login')
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--gray-50);
}

.dashboard-header {
  background: var(--white);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.dashboard-header h1 {
  color: var(--gray-900);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info span {
  color: var(--gray-700);
  font-weight: 500;
}

.logout-btn {
  background: var(--error);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 600;
}

.logout-btn:hover {
  background: #DC2626;
  transform: translateY(-1px);
}

.dashboard-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.balance-section {
  margin-bottom: 2rem;
}

.balance-card {
  background: linear-gradient(135deg, var(--jade-green), var(--jade-green-light));
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 168, 107, 0.15);
  text-align: center;
  color: var(--white);
  border: 1px solid var(--jade-green);
}

.balance-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  opacity: 0.9;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.action-card {
  background: var(--white);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--gray-200);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-card h3 {
  margin: 0 0 1.5rem 0;
  color: var(--gray-900);
  font-size: 1.25rem;
  font-weight: 600;
}

.deposit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.admin-card {
  border-left: 4px solid var(--warning);
}

.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-btn {
  background: var(--navy-blue);
  color: var(--white);
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  text-align: center;
}

.admin-btn:hover {
  background: var(--navy-blue-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.admin-btn.withdraw {
  background: var(--error);
}

.admin-btn.withdraw:hover {
  background: #DC2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.transactions-section {
  background: var(--white);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--gray-200);
}

.transactions-section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--gray-900);
  font-size: 1.25rem;
  font-weight: 600;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  background: var(--white);
  border-radius: 12px;
  color: var(--gray-500);
  border: 1px dashed var(--gray-300);
}

.transaction-item {
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--white);
  transition: all 0.3s ease;
}

.transaction-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.transaction-item.pending {
  border-left: 4px solid var(--warning);
  background: #FFFBEB;
}

.transaction-item.approved {
  border-left: 4px solid var(--success);
  background: #F0FDF4;
}

.transaction-item.rejected {
  border-left: 4px solid var(--error);
  background: #FEF2F2;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-type {
  font-weight: 700;
  color: var(--gray-900);
  font-size: 0.875rem;
}

.transaction-user {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-left: 0.5rem;
}

.transaction-amount {
  font-size: 1.125rem;
  font-weight: 700;
}

.transaction-amount.depot {
  color: var(--success);
}

.transaction-amount.retrait {
  color: var(--error);
}

.transaction-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.transaction-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.transaction-status.pending {
  background: var(--warning);
  color: var(--white);
}

.transaction-status.approved {
  background: var(--success);
  color: var(--white);
}

.transaction-status.rejected {
  background: var(--error);
  color: var(--white);
}

.transaction-date {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
}

.approve-btn {
  background: var(--success);
  color: var(--white);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.approve-btn:hover {
  background: var(--jade-green-dark);
}

.reject-btn {
  background: var(--error);
  color: var(--white);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.reject-btn:hover {
  background: #DC2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--white);
  padding: 2rem;
  border-radius: 12px;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: var(--gray-900);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-actions button[type="button"] {
  background: var(--gray-200);
  color: var(--gray-700);
}

.modal-actions button[type="button"]:hover {
  background: var(--gray-300);
}

.modal-actions button[type="submit"] {
  background: var(--success);
  color: var(--white);
}

.modal-actions button[type="submit"]:hover {
  background: var(--jade-green-dark);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-main {
    padding: 1.5rem;
  }
  
  .actions-section {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .balance-amount {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .dashboard-header h1 {
    font-size: 1.25rem;
  }
  
  .user-info {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .dashboard-main {
    padding: 1rem;
  }
  
  .balance-card {
    padding: 1.5rem;
  }
  
  .balance-amount {
    font-size: 1.75rem;
  }
  
  .action-card {
    padding: 1.25rem;
  }
  
  .transactions-section {
    padding: 1.25rem;
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: 0.75rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.125rem;
  }
  
  .user-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .dashboard-main {
    padding: 0.75rem;
  }
  
  .balance-card {
    padding: 1rem;
  }
  
  .balance-amount {
    font-size: 1.5rem;
  }
  
  .actions-section {
    gap: 1rem;
  }
  
  .action-card {
    padding: 1rem;
  }
  
  .action-card h3 {
    font-size: 1.125rem;
  }
  
  .transactions-section {
    padding: 1rem;
  }
  
  .transactions-section h2 {
    font-size: 1.125rem;
  }
  
  .transaction-item {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .transaction-meta {
    align-items: flex-start;
    width: 100%;
  }
  
  .transaction-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .modal {
    padding: 1.5rem;
    min-width: auto;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .dashboard-main {
    padding: 0.5rem;
  }
  
  .balance-card {
    padding: 0.75rem;
  }
  
  .balance-amount {
    font-size: 1.25rem;
  }
  
  .action-card {
    padding: 0.75rem;
  }
  
  .transactions-section {
    padding: 0.75rem;
  }
  
  .transaction-item {
    padding: 0.75rem;
  }
  
  .modal {
    padding: 1rem;
  }
  
  .modal-overlay {
    padding: 0.5rem;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.balance-card {
  animation: slideIn 0.5s ease-out;
}

.action-card {
  animation: slideIn 0.6s ease-out;
}

.transactions-section {
  animation: slideIn 0.7s ease-out;
}

.transaction-item {
  animation: slideIn 0.3s ease-out;
}
</style>
