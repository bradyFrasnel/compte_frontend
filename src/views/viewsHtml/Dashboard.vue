<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-left">
        <button @click="logout" class="logout-icon-btn desktop-only" title="Déconnexion">
          <span class="logout-icon">🚪</span>
        </button>
      </div>

      <h1 class="header-title">
        <img src="/src/assets/logos/logo_fai.png" alt="Logo" class="header-logo">
        <a href="https://shabfai-6a53f.web.app/admin">shabaFAI</a>
      </h1>

      <!-- Desktop : Profil + Admin | Mobile : ☰ -->
      <div class="user-info header-right">
        <button @click="showProfileModal = true" class="profile-icon-btn desktop-only" title="Profil">
          <span class="profile-icon">👤</span>
        </button>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin" class="admin-btn desktop-only" style="padding: 0.5rem 1rem; text-decoration: none;">
          Admin
        </router-link>
        <button @click="toggleDrawer" class="drawer-toggle" title="Menu">
          <span class="hamburger-icon">☰</span>
        </button>
      </div>
    </header>

    <!-- Overlay du drawer -->
    <div
      class="drawer-overlay"
      :class="{ 'drawer-overlay--open': showDrawer }"
      @click="closeDrawer"
    ></div>

    <!-- Drawer Mobile -->
    <div class="mobile-drawer" :class="{ 'mobile-drawer--open': showDrawer }">
      <div class="drawer-header">
        <div class="drawer-avatar">👤</div>
        <div class="drawer-user-info">
          <span class="drawer-username">{{ user?.username }}</span>
          <span class="drawer-role" :class="user?.role?.toLowerCase()">
            {{ user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur' }}
          </span>
        </div>
        <button class="drawer-close" @click="closeDrawer">✕</button>
      </div>

      <div class="drawer-profile-info">
        <div class="drawer-info-item">
          <span class="drawer-info-label">📧 Email</span>
          <span class="drawer-info-value">{{ user?.email }}</span>
        </div>
        <div class="drawer-info-item">
          <span class="drawer-info-label">🏷️ Rôle</span>
          <span class="drawer-info-value role-badge" :class="user?.role?.toLowerCase()">
            {{ user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur' }}
          </span>
        </div>
        <div class="drawer-info-item">
          <span class="drawer-info-label">🆔 ID</span>
          <span class="drawer-info-value drawer-id">{{ user?.id }}</span>
        </div>
        <!-- Lien Admin dans le drawer si applicable -->
        <div v-if="user?.role === 'ADMIN'" class="drawer-info-item">
          <router-link to="/admin" @click="closeDrawer" class="drawer-admin-link">
            🛡️ Aller au panneau Admin
          </router-link>
        </div>
      </div>

      <div class="drawer-actions">
        <button @click="logout(); closeDrawer()" class="drawer-logout-btn">
          <span>🚪</span> Se déconnecter
        </button>
      </div>
    </div>

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
          <form @submit.prevent="handleDepositWithCategory" class="deposit-form">
            <div class="form-group">
              <label for="amount">Montant</label>
              <input
                type="number"
                id="amount"
                v-model.number="depositForm.amount"
                step="0.01"
                min="0.01"
                required
                placeholder="Entrez le montant"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="categorie">Catégorie de dépôt</label>
              <select 
                id="categorie" 
                v-model="depositForm.categorie"
                class="form-input"
                required
              >
                <option value="ABONNEMENT">ABONNEMENT </option>
                <option value="SEMAINE">SEMAINE </option>
              </select>
            </div>
            <div v-if="depositForm.categorie === 'SEMAINE'" class="category-info">
              <p>⚠️ Cette catégorie est réservée aux membres autorisés uniquement</p>
            </div>
            <button type="submit" class="btn-primary" :disabled="depositLoading">
              {{ depositLoading ? 'Dépôt en cours...' : `Déposer (${depositForm.categorie})` }}
            </button>
            <p v-if="depositError" class="error">{{ depositError }}</p>
            <p v-if="depositSuccess" class="success">{{ depositSuccess }}</p>
          </form>
        </div>

        <!-- Message d'erreur de chargement -->
        <div v-if="dataLoadError" class="error-card">
          <p>⚠️ {{ dataLoadError }}</p>
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
                    <span class="user-name">{{ getUsername(transaction) }}</span> 
                    a effectué un <span class="transaction-type-highlight">{{ transaction.type }}</span>
                    <span v-if="transaction.categorie" class="transaction-category">({{ transaction.categorie }})</span>
                    d'un montant de <span class="transaction-amount-highlight">{{ formatCurrency(transaction.amount) }}</span>
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status pending">PENDING</span>
                  <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                </div>
                <div v-if="transaction.userId === user?.id" class="transaction-actions">
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
                    <span class="user-name">{{ getUsername(transaction) }}</span> 
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
                    <span class="user-name">{{ getUsername(transaction) }}</span> 
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
                    <span class="user-name">{{ getUsername(transaction) }}</span> 
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

          <!-- Onglet Membres -->
          <div v-if="activeTab === 'members'" class="tab-content">
            <div class="tab-header">
              <h3>Tableau d'historique des Dépôts</h3>
              <p>Visualisez les dépôts pour la cotisation hebdomadaire.</p>
            </div>
            
            <div v-if="hebdomadaireDeposits.length === 0" class="empty-state" style="margin-bottom: 2rem;">
              <p>Aucun dépôt SEMAINE validé pour le moment.</p>
            </div>
            <div v-else class="table-container" style="overflow-x: auto; margin-bottom: 2rem;">
              <table style="width: 100%; border-collapse: collapse; background: var(--white); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background-color: var(--gray-100); text-align: left;">
                    <th style="padding: 1rem; border-bottom: 2px solid var(--gray-200);">Utilisateur</th>
                    <th style="padding: 1rem; border-bottom: 2px solid var(--gray-200);">Date</th>
                    <th style="padding: 1rem; border-bottom: 2px solid var(--gray-200); text-align: right;">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="depot in hebdomadaireDeposits" :key="depot.id" style="border-bottom: 1px solid var(--gray-200);">
                    <td style="padding: 1rem; font-weight: 500;">@{{ depot.user?.username || getUsername(depot) }}</td>
                    <td style="padding: 1rem; color: var(--gray-600);">{{ formatDate(depot.createdAt) }}</td>
                    <td style="padding: 1rem; text-align: right; font-weight: bold; color: var(--primary);">{{ formatCurrency(depot.amount) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="background-color: var(--primary-light);">
                    <td colspan="2" style="padding: 1rem; text-align: right; color: var(--primary-dark); font-weight: bold;">Total Cotisations :</td>
                    <td style="padding: 1rem; text-align: right; color: var(--primary-dark); font-size: 1.2em; font-weight: 800;">{{ formatCurrency(hebdomadaireTotal) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <h4 style="margin-bottom: 1rem; color: var(--gray-800); border-top: 1px solid var(--gray-200); padding-top: 2rem;">Membres Autorisés</h4>
            <div v-if="members.length === 0" class="empty-state">
              <p>Aucun membre enregistré ou accès non autorisé</p>
            </div>
            <div v-else class="members-list">
              <div v-for="member in members" :key="member.id" class="member-item">
                <div class="member-info">
                  <div class="member-name">{{ member.nom }}</div>
                  <div class="member-details">
                    <span class="member-username">@{{ member.user?.username }}</span>
                    <span class="member-email">{{ member.user?.email }}</span>
                    <span class="member-date">Ajouté le {{ formatDate(member.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modales -->

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
  categorie?: 'SEMAINE' | 'ABONNEMENT'
  user?: {
    username: string
    email: string
    role: string
  }
  justification?: string
}

interface Member {
  id: string
  userId: string
  nom: string
  createdAt: string
  user?: {
    username: string
    email: string
    role: string
  }
}

const router = useRouter()
const authStore = useAuthStore()

const balance = ref(0)
const transactions = ref<Transaction[]>([])
const members = ref<Member[]>([])

// Formulaires
const depositForm = ref({
  amount: 0,
  categorie: 'ABONNEMENT' as 'SEMAINE' | 'ABONNEMENT'
})

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

const hebdomadaireDeposits = computed(() => {
  return transactions.value.filter(t => t.type === 'DEPOT' && t.categorie === 'SEMAINE' && t.status === 'APPROVED')
})

const hebdomadaireTotal = computed(() => {
  return hebdomadaireDeposits.value.reduce((sum, t) => sum + Number(t.amount), 0)
})

const depositLoading = ref(false)
const depositError = ref('')
const depositSuccess = ref('')
const dataLoadError = ref('')

const user = computed(() => authStore.user)

// Système d'onglets
const activeTab = ref('pending')

const tabs = [
  { id: 'pending', label: 'En attente'},
  { id: 'approved', label: 'Approuvées'},
  { id: 'rejected', label: 'Rejetées'},
  { id: 'withdrawals', label: 'Retraits'},
  { id: 'members', label: 'TableauShaba'}
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
    case 'members':
      return members.value.length
    default:
      return 0
  }
}



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

    // Récupérer les membres
    try {
      const membersResponse = await api.get('/members/all')
      members.value = membersResponse.data
    } catch (memberError) {
      console.warn('Impossible de charger les membres:', memberError)
    }

    // Récupérer le solde depuis le backend
    const balanceResponse = await api.get('/transactions/balance')
    balance.value = balanceResponse.data.balance
  } catch (error: any) {
    console.error('Erreur lors du chargement des données:', error)
    
    // Ne pas déconnecter l'utilisateur pour une erreur 500 du backend
    if (error.response?.status === 401) {
      logout()
    } else {
      // Afficher une erreur mais rester connecté
      dataLoadError.value = 'Erreur de chargement des données. Certaines fonctionnalités peuvent être limitées.'
      console.warn('Erreur de chargement des données, mais l\'utilisateur reste connecté')
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

// Drawer mobile
const showDrawer = ref(false)
const toggleDrawer = () => { showDrawer.value = !showDrawer.value }
const closeDrawer = () => { showDrawer.value = false }

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
const getUsername = (transaction: Transaction) => {
  // Priorité 1: Username direct depuis l'objet user
  if (transaction.user?.username) {
    return transaction.user.username
  }
  
  // Priorité 2: Extraction depuis l'email (brady@example.com → brady)
  if (transaction.user?.email) {
    return transaction.user.email.split('@')[0]
  }
  
  // Fallback: ID utilisateur
  return `User-${transaction.userId?.slice(0, 8) || 'Inconnu'}`
}

// Fonctions pour la gestion des membres





// Fonction pour les dépôts catégorisés
const handleDepositWithCategory = async () => {
  depositLoading.value = true
  depositError.value = ''
  depositSuccess.value = ''

  try {
    await api.post('/transactions/deposit-with-category', {
      amount: depositForm.value.amount,
      categorie: depositForm.value.categorie
    })

    depositSuccess.value = `Dépôt de ${formatCurrency(depositForm.value.amount)} (${depositForm.value.categorie}) effectué avec succès!`
    depositForm.value.amount = 0
    
    // Recharger les données
    await loadUserData()
  } catch (err: any) {
    console.error('Erreur dépôt catégorisé:', err)
    if (err.response?.status === 403) {
      depositError.value = 'Seuls les membres peuvent faire des dépôts de catégorie SEMAINE'
    } else {
      depositError.value = err.response?.data?.message || 'Erreur lors du dépôt'
    }
  } finally {
    depositLoading.value = false
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

<style src="../viewsCss/Dashboard.css"></style>
