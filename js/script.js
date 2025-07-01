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
        
        // Filtros
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
                this.updateFilterButtons(btn);
            });
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
        this.tasks.unshift(newTask); // Adiciona no início
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
        if (!this.showConfirmDialog(`Deseja realmente excluir a tarefa "${task.text}"?`)) {
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
        
        if (!this.showConfirmDialog(`Deseja excluir ${completedCount} tarefa(s) concluída(s)?`)) {
            return;
        }
        
        this.tasks = this.tasks.filter(t