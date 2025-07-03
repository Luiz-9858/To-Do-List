/**
 * Lista de Tarefas - JavaScript
 * Sistema completo de gerenciamento de tarefas
 */

class TodoApp {
    constructor() {
        // Estado da aplicação
        this.tasks = [];
        this.currentFilter = 'all';
        this.taskIdCounter = 1;
        
        // Elementos DOM
        this.elements = {
            taskInput: document.getElementById('taskInput'),
            addBtn: document.getElementById('addBtn'),
            taskList: document.getElementById('taskList'),
            emptyState: document.getElementById('emptyState'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            clearCompletedBtn: document.getElementById('clearCompletedBtn'),
            sectionTitle: document.getElementById('sectionTitle'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            toastContainer: document.getElementById('toastContainer'),
            
            // Contadores
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            pendingTasks: document.getElementById('pendingTasks'),
            allCount: document.getElementById('allCount'),
            pendingCount: document.getElementById('pendingCount'),
            completedCount: document.getElementById('completedCount')
        };
        
        // Inicializar app
        this.init();
    }
    
    /**
     * Inicializa a aplicação
     */
    init() {
        this.setupEventListeners();
        this.setupFilterEvents();
        this.loadTasks();
        this.render();
        this.showToast('Aplicação carregada!', 'Bem-vindo à sua lista de tarefas', 'success');
    }
    
    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        // Input e botão adicionar
        this.elements.addBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        // Limpar concluídas
        this.elements.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter para adicionar tarefa
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.addTask();
                e.preventDefault();
            }
            
            // ESC para limpar input
            if (e.key === 'Escape') {
                this.elements.taskInput.value = '';
                this.elements.taskInput.focus();
            }
        });
        
        // Auto-save quando sair da página
        window.addEventListener('beforeunload', () => {
            this.saveTasks();
        });
    }
    
    /**
     * Configura os eventos dos filtros
     */
    setupFilterEvents() {
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setFilter(filter);
                this.updateFilterButtons(filter);
            });
        });
    }
    
    /**
     * Atualiza os botões de filtro
     */
    updateFilterButtons(activeFilter) {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === activeFilter) {
                btn.classList.add('active');
            }
        });
    }
    
    /**
     * Adiciona uma nova tarefa
     */
    addTask() {
        const taskText = this.elements.taskInput.value.trim();
        
        // Validações
        if (!taskText) {
            this.showToast('Erro', 'Por favor, digite uma tarefa!', 'error');
            this.elements.taskInput.focus();
            return;
        }
        
        if (taskText.length < 3) {
            this.showToast('Erro', 'A tarefa deve ter pelo menos 3 caracteres!', 'error');
            return;
        }
        
        // Verificar duplicatas
        if (this.tasks.some(task => task.text.toLowerCase() === taskText.toLowerCase())) {
            this.showToast('Aviso', 'Esta tarefa já existe!', 'error');
            return;
        }
        
        // Criar nova tarefa
        const newTask = {
            id: this.taskIdCounter++,
            text: taskText,
            completed: false,
            createdAt: new Date(),
            completedAt: null,
            priority: 'normal'
        };
        
        // Adicionar à lista
        this.tasks.unshift(newTask);
        this.elements.taskInput.value = '';
        
        // Feedback visual
        this.showLoading(300);
        setTimeout(() => {
            this.render();
            this.saveTasks();
            this.showToast('Sucesso!', `Tarefa "${taskText}" adicionada!`, 'success');
        }, 300);
    }
    
    /**
     * Alterna o estado de uma tarefa
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        
        // Animação suave
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                taskElement.style.transform = '';
            }, 200);
        }
        
        this.render();
        this.saveTasks();
        
        // Feedback
        const action = task.completed ? 'concluída' : 'reaberta';
        this.showToast('Tarefa atualizada!', `Tarefa ${action} com sucesso!`, 'success');
    }
    
    /**
     * Remove uma tarefa
     */
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Confirmação personalizada
        if (!confirm(`Deseja realmente excluir a tarefa "${task.text}"?`)) {
            return;
        }
        
        // Animação de saída
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.render();
                this.saveTasks();
                this.showToast('Tarefa removida!', `"${task.text}" foi excluída!`, 'success');
            }, 300);
        }
    }
    
    /**
     * Limpa todas as tarefas concluídas
     */
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showToast('Info', 'Não há tarefas concluídas para limpar!', 'error');
            return;
        }
        
        if (!confirm(`Deseja excluir ${completedCount} tarefa(s) concluída(s)?`)) {
            return;
        }
        
        this.tasks = this.tasks.filter(t => !t.completed);
        this.render();
        this.saveTasks();
        this.showToast('Tarefas limpas!', `${completedCount} tarefa(s) concluída(s) removida(s)!`, 'success');
    }
    
    /**
     * Define o filtro atual
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
        
        // Atualiza título da seção
        let title = 'Todas as Tarefas';
        if (filter === 'pending') title = 'Tarefas Pendentes';
        if (filter === 'completed') title = 'Tarefas Concluídas';
        
        this.elements.sectionTitle.textContent = title;
        
        // Mostra/oculta botão de limpar concluídas
        this.elements.clearCompletedBtn.style.display = filter === 'completed' ? 'block' : 'none';
    }
    
    /**
     * Renderiza a lista de tarefas
     */
    render() {
        // Filtra as tarefas
        let filteredTasks = [];
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = this.tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(t => t.completed);
                break;
            default:
                filteredTasks = [...this.tasks];
        }
        
        // Renderiza as tarefas
        this.elements.taskList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <div class="task-actions">
                    <button class="delete-btn" title="Excluir tarefa">×</button>
                </div>
            `;
            
            // Adiciona event listeners
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            
            const deleteBtn = taskElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
            
            this.elements.taskList.appendChild(taskElement);
        });
        
        // Atualiza o estado vazio
        this.elements.emptyState.classList.toggle('show', filteredTasks.length === 0);
        
        // Atualiza estatísticas
        this.updateStats();
    }
    
    /**
     * Atualiza as estatísticas
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.elements.totalTasks.textContent = total;
        this.elements.completedTasks.textContent = completed;
        this.elements.pendingTasks.textContent = pending;
        
        // Atualiza contadores dos filtros
        this.elements.allCount.textContent = total;
        this.elements.pendingCount.textContent = pending;
        this.elements.completedCount.textContent = completed;
    }
    
    /**
     * Carrega as tarefas do localStorage
     */
    loadTasks() {
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
            try {
                const parsedTasks = JSON.parse(savedTasks);
                this.tasks = parsedTasks.tasks || [];
                this.taskIdCounter = parsedTasks.taskIdCounter || 1;
                this.currentFilter = parsedTasks.currentFilter || 'all';
                
                // Atualiza o filtro ativo
                this.updateFilterButtons(this.currentFilter);
                
                this.showToast('Tarefas carregadas!', 'Suas tarefas foram recuperadas com sucesso', 'success');
            } catch (e) {
                console.error('Erro ao carregar tarefas:', e);
                this.showToast('Erro', 'Não foi possível carregar as tarefas salvas', 'error');
            }
        }
    }
    
    /**
     * Salva as tarefas no localStorage
     */
    saveTasks() {
        const data = {
            tasks: this.tasks,
            taskIdCounter: this.taskIdCounter,
            currentFilter: this.currentFilter
        };
        
        localStorage.setItem('todoTasks', JSON.stringify(data));
    }
    
    /**
     * Mostra o spinner de carregamento
     */
    showLoading(duration) {
        this.elements.loadingSpinner.style.display = 'flex';
        setTimeout(() => {
            this.elements.loadingSpinner.style.display = 'none';
        }, duration);
    }
    
    /**
     * Mostra uma notificação toast
     */
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <h4 class="toast-title">${title}</h4>
                <p class="toast-message">${message}</p>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});