class Cliente {
    constructor(id, nome, cpf, email, telefone, cidade) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.email = email;
        this.telefone = telefone;
        this.cidade = cidade;
    }
}

class GerenciadorClientes {
    constructor() {
        this.clientes = JSON.parse(localStorage.getItem('database_clientes')) || [];
    }

    gravar() {
        localStorage.setItem('database_clientes', JSON.stringify(this.clientes));
    }

    adicionar(cliente) {
        this.clientes.push(cliente);
        this.gravar();
    }

    atualizar(id, dadosNovos) {
        const index = this.clientes.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clientes[index] = { ...this.clientes[index], ...dadosNovos };
            this.gravar();
            return true;
        }
        return false;
    }

    excluir(id) {
        this.clientes = this.clientes.filter(c => c.id !== id);
        this.gravar();
    }

    listar(filtro = '') {
        if (!filtro) return this.clientes;
        
        const termo = filtro.toLowerCase();
        return this.clientes.filter(c => 
            c.nome.toLowerCase().includes(termo) || 
            c.email.toLowerCase().includes(termo)
        );
    }

    emailDuplicado(email, idAtual = null) {
        return this.clientes.some(c => c.email.toLowerCase() === email.toLowerCase() && c.id !== idAtual);
    }

    cpfDuplicado(cpf, idAtual = null) {
        return this.clientes.some(c => c.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '') && c.id !== idAtual);
    }

    get totalRegistros() {
        return this.clientes.length;
    }
}

const db = new GerenciadorClientes();

const ViewDOM = {
    form: document.getElementById('cliente-form'),
    idInput: document.getElementById('cliente-id'),
    nomeInput: document.getElementById('nome'),
    cpfInput: document.getElementById('cpf'),
    emailInput: document.getElementById('email'),
    telefoneInput: document.getElementById('telefone'),
    cidadeInput: document.getElementById('cidade'),
    tableBody: document.getElementById('clientes-table-body'),
    searchInput: document.getElementById('search-input'),
    totalBadge: document.getElementById('total-clientes'),
    formTitle: document.getElementById('form-title'),
    btnCancelar: document.getElementById('btn-cancelar'),

    init() {
        this.vincularEventos();
        this.atualizarInterface();
    },

    atualizarInterface(listaFiltrada) {
        const dados = listaFiltrada || db.listar();
        this.tableBody.innerHTML = '';

        if (dados.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">Nenhum registro encontrado.</td></tr>`;
        } else {
            dados.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${cliente.nome}</strong></td>
                    <td>${cliente.cpf}</td>
                    <td>${cliente.email}</td>
                    <td>${cliente.telefone}</td>
                    <td>${cliente.cidade}</td>
                    <td class="txt-center">
                        <button class="btn-table-edit" onclick="ViewDOM.carregarParaEdicao('${cliente.id}')">Editar</button>
                        <button class="btn-table-delete" onclick="ViewDOM.removerComConfirmacao('${cliente.id}')">Excluir</button>
                    </td>
                `;
                this.tableBody.appendChild(tr);
            });
        }
        this.totalBadge.textContent = db.totalRegistros;
    },

    salvarDados(e) {
        e.preventDefault();

        const id = this.idInput.value;
        const nome = this.nomeInput.value.trim();
        const cpf = this.cpfInput.value.trim();
        const email = this.emailInput.value.trim();
        const telefone = this.telefoneInput.value.trim();
        const cidade = this.cidadeInput.value.trim();

        if (!nome || !cpf || !email || !telefone || !cidade) {
            alert('Erro: Preencha todos os campos obrigatórios.');
            return;
        }

        if (db.emailDuplicado(email, id || null)) {
            alert('Conflito: Este endereço de e-mail já pertence a outro cliente.');
            return;
        }
        if (db.cpfDuplicado(cpf, id || null)) {
            alert('Conflito: Este número de CPF já está cadastrado.');
            return;
        }

        if (id) {
            db.atualizar(id, { nome, cpf, email, telefone, cidade });
        } else {
            const novoId = 'id_' + Date.now();
            const novoCliente = new Cliente(novoId, nome, cpf, email, telefone, cidade);
            db.adicionar(novoCliente);
        }

        this.limparFormulario();
        this.atualizarInterface();
    },

    carregarParaEdicao(id) {
        const cliente = db.listar().find(c => c.id === id);
        if (!cliente) return;

        this.idInput.value = cliente.id;
        this.nomeInput.value = cliente.nome;
        this.cpfInput.value = cliente.cpf;
        this.emailInput.value = cliente.email;
        this.telefoneInput.value = cliente.telefone;
        this.cidadeInput.value = cliente.cidade;

        this.formTitle.textContent = "Modificar Registro de Cliente";
        this.btnCancelar.style.display = "inline-block";
        this.nomeInput.focus();
    },

    removerComConfirmacao(id) {
        if (confirm('Atenção: Confirma a exclusão definitiva deste cliente do sistema?')) {
            db.excluir(id);
            this.atualizarInterface();
            if (this.idInput.value === id) this.limparFormulario();
        }
    },

    limparFormulario() {
        this.form.reset();
        this.idInput.value = '';
        this.formTitle.textContent = "Cadastrar Novo Cliente";
        this.btnCancelar.style.display = "none";
    },

    aplicarMascaraCPF(e) {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = v;
    },

    vincularEventos() {
        this.form.addEventListener('submit', (e) => this.salvarDados(e));
        this.btnCancelar.addEventListener('click', () => this.limparFormulario());
        this.cpfInput.addEventListener('input', (e) => this.aplicarMascaraCPF(e));
        
        this.searchInput.addEventListener('input', (e) => {
            const filtrados = db.listar(e.target.value);
            this.atualizarInterface(filtrados);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ViewDOM.init());
