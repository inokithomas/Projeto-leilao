/* ============================================================
   SISTEMA DE LOGIN / TABS
=============================================================== */

const wrapper = document.querySelector('.wrapper');
const signUpLink = document.querySelector('.signUp-link');
const signInLink = document.querySelector('.signIn-link');

if (signUpLink) {
    signUpLink.addEventListener('click', () => {
        wrapper.classList.add('animate-signIn');
        wrapper.classList.remove('animate-signUp');
    });
}

if (signInLink) {
    signInLink.addEventListener('click', () => {
        wrapper.classList.add('animate-signUp');
        wrapper.classList.remove('animate-signIn');
    });
}

/* ============================================================
   LOGIN ADMIN
=============================================================== */

const ADMIN_USERNAME = 'adminleilão';
const ADMIN_PASSWORD = '12345678';

let isAdminLoggedIn = false;

function checkAdminLogin() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

function loginAdmin(username, password) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        isAdminLoggedIn = true;
        return true;
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
    isAdminLoggedIn = false;
}

/* ============================================================
   SISTEMA DE CARROS
=============================================================== */

function salvarCarros(carros) {
    localStorage.setItem('carros', JSON.stringify(carros));
}

function recuperarCarros() {
    const carros = localStorage.getItem('carros');
    return carros ? JSON.parse(carros) : [];
}

function adicionarCarro(carro) {
    const carros = recuperarCarros();
    carro.id_leilao = Date.now();
    carros.push(carro);
    salvarCarros(carros);
    return carro;
}

function removerCarro(id) {
    const carros = recuperarCarros();
    const novoArray = carros.filter(c => c.id_leilao !== parseInt(id));
    salvarCarros(novoArray);
}

/* ============================================================
   LANCES
=============================================================== */

function salvarLance(leilaoId, valor) {
    localStorage.setItem(`lance_${leilaoId}`, valor);
}

function recuperarLance(leilaoId) {
    return localStorage.getItem(`lance_${leilaoId}`);
}

function atualizarExibicaoLance(leilaoId, valor) {
    const elemento = document.querySelector(
        `[data-leilao-id="${leilaoId}"] .lance-valor`
    );
    if (elemento)
        elemento.textContent = parseFloat(valor).toFixed(2);
}

/* ================================================
   🔥 CORREÇÃO 1: Impedir LANCE MENOR
================================================= */

function processarNovoLance(leilaoId, valor) {
    if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
        alert('Por favor, insira um valor válido.');
        return;
    }

    const carros = recuperarCarros();
    const carro = carros.find(c => c.id_leilao == leilaoId);

    if (!carro) return;

    const precoInicial = parseFloat(carro.preco_inicial);
    const lanceAtual = parseFloat(recuperarLance(leilaoId)) || carro.lance_atual;
    const novoLance = parseFloat(valor);

    if (novoLance < precoInicial || novoLance <= lanceAtual) {
        alert(`O lance deve ser MAIOR que R$ ${lanceAtual.toFixed(2)} e o preço inicial.`);
        return;
    }

    salvarLance(leilaoId, novoLance);
    atualizarExibicaoLance(leilaoId, novoLance);

    /* 🔥 CORREÇÃO 2: Atualiza o modal imediatamente */
    const modalLance = document.getElementById("modal-lance");
    if (modalLance) modalLance.textContent = novoLance.toFixed(2);

    alert(`Lance de R$ ${novoLance.toFixed(2)} registrado!`);
}

/* ============================================================
   TROCA DE PÁGINA
=============================================================== */

function mostrarPagina(id) {
    if (id === 'admin-panel' && !isAdminLoggedIn) {
        alert("Você precisa fazer login como administrador.");
        id = 'login-admin';
    }

    document.querySelectorAll('.pagina').forEach(p =>
        p.classList.remove('ativa')
    );
    document.getElementById(id).classList.add('ativa');

    if (id === 'home' || id === 'cliente') carregarLeiloes();
    if (id === 'admin-panel') carregarCarrosAdmin();
}

/* ============================================================
   CARDS DA HOME
=============================================================== */

function adicionarCardLeilao(leilao, container) {
    const template = document.getElementById('template-card-leilao');
    if (!template) return;

    const clone = document.importNode(template.content, true);
    const card = clone.querySelector('.card');
    card.setAttribute('data-leilao-id', leilao.id_leilao);

    card.querySelector(".carro-imagem").src = leilao.imagem;
    card.querySelector(".carro-nome").textContent = leilao.carro_nome;
    card.querySelector(".carro-info").textContent =
        `${leilao.marca} ${leilao.modelo} (${leilao.ano})`;

    const lanceSalvo = recuperarLance(leilao.id_leilao);
    const valor = lanceSalvo || leilao.lance_atual || leilao.preco_inicial;
    card.querySelector(".lance-valor").textContent = parseFloat(valor).toFixed(2);

    card.querySelector(".btn-info").addEventListener("click", () =>
        abrirInfoCarro(leilao)
    );

    container.appendChild(clone);
}

/* ============================================================
   POPUP DETALHES
=============================================================== */

function abrirInfoCarro(car) {
    const modal = document.getElementById("modal-detalhes");
    document.body.style.overflow = "hidden";

    document.getElementById("modal-imagem").src = car.imagem;
    document.getElementById("modal-nome").textContent = car.carro_nome;
    document.getElementById("modal-marca").textContent = car.marca;
    document.getElementById("modal-modelo").textContent = car.modelo;
    document.getElementById("modal-ano").textContent = car.ano;
    document.getElementById("modal-km").textContent = car.km;
    document.getElementById("modal-cambio").textContent = car.cambio;
    document.getElementById("modal-combustivel").textContent = car.combustivel;
    document.getElementById("modal-motor").textContent = car.motor;

    const lanceSalvo = recuperarLance(car.id_leilao) || car.lance_atual;
    document.getElementById("modal-preco").textContent = car.preco_inicial;
    document.getElementById("modal-lance").textContent = lanceSalvo;

    document.getElementById("modal-btn-lance").onclick = () => {
        const novoLance = document.getElementById("modal-novo-lance").value;
        processarNovoLance(car.id_leilao, novoLance);
    };

    modal.style.display = "flex";
}

document.getElementById("modal-close").onclick = () => {
    document.getElementById("modal-detalhes").style.display = "none";
    document.body.style.overflow = "auto";
};

/* ============================================================
   ADMIN – CARDS COM REMOVER + EDITAR
=============================================================== */

function adicionarCardAdmin(carro, container) {
    const template = document.getElementById('template-card-admin');
    if (!template) return;

    const clone = document.importNode(template.content, true);
    const card = clone.querySelector('.card');

    card.setAttribute('data-leilao-id', carro.id_leilao);
    card.querySelector(".carro-imagem").src = carro.imagem;
    card.querySelector(".carro-nome").textContent = carro.carro_nome;
    card.querySelector(".carro-info").textContent =
        `${carro.marca} ${carro.modelo} (${carro.ano})`;

    card.querySelector(".preco-inicial").textContent = carro.preco_inicial;

    card.querySelector(".btn-remover").addEventListener("click", () => {
        if (confirm(`Remover ${carro.carro_nome}?`)) {
            removerCarro(carro.id_leilao);
            carregarCarrosAdmin();
            carregarLeiloes();
        }
    });

    card.querySelector(".btn-editar").addEventListener("click", () => {
        abrirEdicaoCarro(carro);
    });

    container.appendChild(clone);
}

/* ============================================================
   EDITAR CARRO
=============================================================== */

function abrirEdicaoCarro(carro) {
    mostrarPagina("admin-panel");

    document.getElementById("nome").value = carro.carro_nome;
    document.getElementById("marca").value = carro.marca;
    document.getElementById("modelo").value = carro.modelo;
    document.getElementById("ano").value = carro.ano;
    document.getElementById("categoria").value = carro.categoria;
    document.getElementById("km").value = carro.km;
    document.getElementById("combustivel").value = carro.combustivel;
    document.getElementById("cambio").value = carro.cambio;
    document.getElementById("motor").value = carro.motor;
    document.getElementById("preco").value = carro.preco_inicial;

    document.getElementById("form-carro")
        .setAttribute("data-edit-id", carro.id_leilao);
}

/* ============================================================
   CARREGAR CARROS
=============================================================== */

function carregarLeiloes() {
    const lista = document.getElementById('lista-carros');
    lista.innerHTML = "";
    recuperarCarros().forEach(c => adicionarCardLeilao(c, lista));
}

function carregarCarrosAdmin() {
    const lista = document.getElementById('lista-admin-carros');
    lista.innerHTML = "";
    recuperarCarros().forEach(c => adicionarCardAdmin(c, lista));
}

/* ============================================================
   BUSCA
=============================================================== */

function buscarCarros(termo) {
    const lista = document.getElementById('lista-carros');
    const carros = recuperarCarros();
    const t = termo.toLowerCase();

    if (t === "") return carregarLeiloes();

    const filtrados = carros.filter(c =>
        c.carro_nome.toLowerCase().includes(t) ||
        c.marca.toLowerCase().includes(t) ||
        c.modelo.toLowerCase().includes(t) ||
        String(c.ano).includes(t)
    );

    lista.innerHTML = "";
    filtrados.forEach(c => adicionarCardLeilao(c, lista));
}

/* ============================================================
   DOM LOAD
=============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    isAdminLoggedIn = checkAdminLogin();
    mostrarPagina('home');

    const inputBusca = document.getElementById("searchInput");
    inputBusca.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            buscarCarros(inputBusca.value.trim());
        }
    });

    const formAdmin = document.getElementById("form-login-admin");
    if (formAdmin) {
        formAdmin.addEventListener("submit", e => {
            e.preventDefault();

            const user = document.getElementById("admin-username").value;
            const pass = document.getElementById("admin-password").value;

            if (loginAdmin(user, pass)) {
                mostrarPagina("admin-panel");
            } else {
                document.getElementById("login-error").textContent =
                    "Usuário ou senha incorretos!";
            }
        });
    }
});

/* ============================================================
   FORM DE CADASTRO + EDIÇÃO
=============================================================== */

const formCarro = document.getElementById("form-carro");

if (formCarro) {
    formCarro.addEventListener("submit", e => {
        e.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const marca = document.getElementById("marca").value.trim();
        const modelo = document.getElementById("modelo").value.trim();
        const ano = document.getElementById("ano").value.trim();
        const categoria = document.getElementById("categoria").value.trim();
        const preco = parseFloat(document.getElementById("preco").value.trim());
        const imgInput = document.getElementById("imagem-carro");
        const km = document.getElementById("km").value.trim();
        const combustivel = document.getElementById("combustivel").value.trim();
        const cambio = document.getElementById("cambio").value.trim();
        const motor = document.getElementById("motor").value.trim();

        function salvarCarroComImagem(img) {
            const novoCarro = {
                carro_nome: nome,
                marca,
                modelo,
                ano,
                categoria,
                preco_inicial: preco,
                lance_atual: preco,
                imagem: img,
                km,
                combustivel,
                cambio,
                motor,
            };

            const editId = formCarro.getAttribute("data-edit-id");

            if (editId) {
                atualizarCarro(editId, novoCarro);
                formCarro.removeAttribute("data-edit-id");
            } else {
                adicionarCarro(novoCarro);
            }

            carregarCarrosAdmin();
            carregarLeiloes();
            formCarro.reset();
        }

        if (imgInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => salvarCarroComImagem(reader.result);
            reader.readAsDataURL(imgInput.files[0]);
        } else {
            salvarCarroComImagem("");
        }
    });
}

function atualizarCarro(id, dadosAtualizados) {
    const carros = recuperarCarros();
    const idx = carros.findIndex(c => c.id_leilao == id);

    if (idx !== -1) {
        dadosAtualizados.id_leilao = parseInt(id);
        carros[idx] = dadosAtualizados;
        salvarCarros(carros);
        alert("Carro atualizado com sucesso!");
    }
}
