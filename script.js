const API_URL = "https://painel-att-backend.onrender.com";
const TOKEN_KEY = "token_att";
const USER_KEY = "usuario_logado_att";

let funcionariosCache = [];
let idParaExcluir = null;

function salvarSessao(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function obterToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function obterUsuarioLogado() {
  const usuario = localStorage.getItem(USER_KEY);
  return usuario ? JSON.parse(usuario) : null;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "index.html";
}

function formatarNumero(valor) {
  return Number(valor).toLocaleString("pt-BR");
}

function statusTexto(entradas) {
  if (entradas === 0) return "Ninguém entrou";
  if (entradas === 1) return "1 entrou";
  return `${formatarNumero(entradas)} entraram`;
}

function classeBadge(entradas) {
  if (entradas === 0) return "badge zero";
  if (entradas < 50) return "badge medium";
  return "badge high";
}

function gerarLinkCompleto(slug) {
  return `https://seusite.com/${slug}`;
}

function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = mensagem;
  toast.className = `toast ativo ${tipo}`;

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

function abrirModalAdicionar() {
  const modal = document.getElementById("modalAdicionar");
  if (modal) modal.classList.add("ativo");
}

function fecharModalAdicionar() {
  const modal = document.getElementById("modalAdicionar");
  const form = document.getElementById("formAdicionar");
  if (modal) modal.classList.remove("ativo");
  if (form) form.reset();
}

function abrirModalEditar(id) {
  const modal = document.getElementById("modalEditar");
  const pessoa = funcionariosCache.find((item) => item.id === id);
  if (!modal || !pessoa) return;

  document.getElementById("editId").value = pessoa.id;
  document.getElementById("editNome").value = pessoa.nome;
  document.getElementById("editUsuario").value = pessoa.usuario;
  document.getElementById("editSenha").value = "";
  document.getElementById("editLink").value = pessoa.link;
  document.getElementById("editEntradas").value = pessoa.entraram;
  document.getElementById("editPedidos").value = pessoa.pedidos;

  modal.classList.add("ativo");
}

function fecharModalEditar() {
  const modal = document.getElementById("modalEditar");
  const form = document.getElementById("formEditar");
  if (modal) modal.classList.remove("ativo");
  if (form) form.reset();
}

function abrirModalExcluir(id) {
  const modal = document.getElementById("modalExcluir");
  const pessoa = funcionariosCache.find((item) => item.id === id);
  if (!modal || !pessoa) return;

  idParaExcluir = id;
  document.getElementById("nomeExcluir").textContent = pessoa.nome;
  modal.classList.add("ativo");
}

function fecharModalExcluir() {
  const modal = document.getElementById("modalExcluir");
  if (modal) modal.classList.remove("ativo");
  idParaExcluir = null;
}

function verificarPagina() {
  const pagina = window.location.pathname.split("/").pop();

  if (pagina === "login.html" || pagina === "") {
    iniciarLogin();
    return;
  }

  const usuario = obterUsuarioLogado();
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }

  if (pagina === "admin.html") {
    if (usuario.tipo !== "admin") {
      window.location.href = "funcionario.html";
      return;
    }
    iniciarAdmin();
  }

  if (pagina === "funcionario.html") {
    if (usuario.tipo !== "funcionario") {
      window.location.href = "admin.html";
      return;
    }
    iniciarFuncionario();
  }
}

async function fazerLogin(usuario, senha) {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usuario, senha })
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro no login.");
  }

  return dados;
}

function iniciarLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const mensagem = document.getElementById("mensagemLogin");

    mensagem.textContent = "";

    try {
      const dados = await fazerLogin(usuario, senha);
      salvarSessao(dados.token, dados.usuario);

      if (dados.usuario.tipo === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "funcionario.html";
      }
    } catch (error) {
      mensagem.textContent = error.message;
    }
  });
}

async function buscarFuncionarios() {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}/funcionarios`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao buscar funcionários.");
  }

  return dados;
}

async function buscarMeuPerfil() {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}/funcionarios/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao buscar perfil.");
  }

  return dados;
}

async function criarFuncionario(dadosFuncionario) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}/funcionarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dadosFuncionario)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao criar funcionário.");
  }

  return dados;
}

async function atualizarFuncionario(id, dadosFuncionario) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}/funcionarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dadosFuncionario)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao atualizar funcionário.");
  }

  return dados;
}

async function excluirFuncionario(id) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}/funcionarios/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao excluir funcionário.");
  }

  return dados;
}

function atualizarCardsAdmin(lista) {
  const totalPessoas = lista.length;
  const totalEntradas = lista.reduce((soma, item) => soma + Number(item.entraram), 0);
  const totalPedidos = lista.reduce((soma, item) => soma + Number(item.pedidos), 0);
  const top = lista.length ? lista[0].nome : "-";

  document.getElementById("totalPessoas").textContent = formatarNumero(totalPessoas);
  document.getElementById("totalEntradas").textContent = formatarNumero(totalEntradas);
  document.getElementById("totalPedidos").textContent = formatarNumero(totalPedidos);
  document.getElementById("topRanking").textContent = top;
}

function renderizarTabela(lista) {
  const buscaInput = document.getElementById("busca");
  const tabelaBody = document.getElementById("tabelaBody");
  const mensagemVazia = document.getElementById("mensagemVazia");

  if (!tabelaBody) return;

  const termo = buscaInput ? buscaInput.value.trim().toLowerCase() : "";
  const listaOrdenada = [...lista].sort((a, b) => b.entraram - a.entraram);

  atualizarCardsAdmin(listaOrdenada);

  const filtrados = listaOrdenada.filter((item) =>
    item.nome.toLowerCase().includes(termo)
  );

  tabelaBody.innerHTML = "";

  if (filtrados.length === 0) {
    mensagemVazia.style.display = "block";
    return;
  }

  mensagemVazia.style.display = "none";

  filtrados.forEach((item, index) => {
    const tr = document.createElement("tr");
    const linkPessoal = gerarLinkCompleto(item.link);

    tr.innerHTML = `
      <td data-label="Posição">#${index + 1}</td>
      <td data-label="Nome">${item.nome}</td>
      <td data-label="Entradas">${formatarNumero(item.entraram)}</td>
      <td data-label="Pedidos">${formatarNumero(item.pedidos)}</td>
      <td data-label="Status">
        <span class="${classeBadge(item.entraram)}">${statusTexto(item.entraram)}</span>
      </td>
      <td data-label="Link">
        <div class="acoes">
          <button class="mini-btn link" onclick="copiarTexto('${linkPessoal}')">Copiar link</button>
        </div>
      </td>
      <td data-label="Ações">
        <div class="acoes">
          <button class="mini-btn" onclick="abrirModalEditar(${item.id})">Editar</button>
          <button class="mini-btn entrada" onclick="somarEntrada(${item.id})">+ Entrada</button>
          <button class="mini-btn excluir" onclick="abrirModalExcluir(${item.id})">Excluir</button>
        </div>
      </td>
    `;

    tabelaBody.appendChild(tr);
  });
}

async function carregarFuncionariosAdmin() {
  try {
    const lista = await buscarFuncionarios();
    funcionariosCache = lista;
    renderizarTabela(lista);
  } catch (error) {
    mostrarToast(error.message, "erro");
    if (error.message.toLowerCase().includes("token")) {
      logout();
    }
  }
}

async function enviarAdicionarFuncionario(event) {
  event.preventDefault();

  const nome = document.getElementById("addNome").value.trim();
  const usuario = document.getElementById("addUsuario").value.trim().toLowerCase();
  const senha = document.getElementById("addSenha").value.trim();
  const link = document.getElementById("addLink").value.trim().toLowerCase();

  if (!nome || !usuario || !senha || !link) {
    mostrarToast("Preencha todos os campos.", "erro");
    return;
  }

  try {
    await criarFuncionario({ nome, usuario, senha, link });
    fecharModalAdicionar();
    await carregarFuncionariosAdmin();
    mostrarToast("Funcionário criado com sucesso.", "sucesso");
  } catch (error) {
    mostrarToast(error.message, "erro");
  }
}

async function enviarEditarFuncionario(event) {
  event.preventDefault();

  const id = Number(document.getElementById("editId").value);
  const nome = document.getElementById("editNome").value.trim();
  const usuario = document.getElementById("editUsuario").value.trim().toLowerCase();
  const senha = document.getElementById("editSenha").value.trim();
  const link = document.getElementById("editLink").value.trim().toLowerCase();
  const entraram = Number(document.getElementById("editEntradas").value);
  const pedidos = Number(document.getElementById("editPedidos").value);

  if (!nome || !usuario || !link) {
    mostrarToast("Preencha os campos obrigatórios.", "erro");
    return;
  }

  try {
    await atualizarFuncionario(id, {
      nome,
      usuario,
      senha,
      link,
      entraram,
      pedidos
    });

    fecharModalEditar();
    await carregarFuncionariosAdmin();
    mostrarToast("Funcionário atualizado com sucesso.", "sucesso");
  } catch (error) {
    mostrarToast(error.message, "erro");
  }
}

async function somarEntrada(id) {
  const pessoa = funcionariosCache.find((item) => item.id === id);
  if (!pessoa) return;

  try {
    await atualizarFuncionario(id, {
      nome: pessoa.nome,
      usuario: pessoa.usuario,
      senha: "",
      link: pessoa.link,
      entraram: Number(pessoa.entraram) + 1,
      pedidos: Number(pessoa.pedidos)
    });

    await carregarFuncionariosAdmin();
    mostrarToast("Entrada adicionada.", "sucesso");
  } catch (error) {
    mostrarToast(error.message, "erro");
  }
}

async function confirmarExcluir() {
  if (!idParaExcluir) return;

  try {
    await excluirFuncionario(idParaExcluir);
    fecharModalExcluir();
    await carregarFuncionariosAdmin();
    mostrarToast("Funcionário excluído com sucesso.", "sucesso");
  } catch (error) {
    mostrarToast(error.message, "erro");
  }
}

async function iniciarAdmin() {
  const busca = document.getElementById("busca");
  const formAdicionar = document.getElementById("formAdicionar");
  const formEditar = document.getElementById("formEditar");

  if (busca) {
    busca.addEventListener("input", () => renderizarTabela(funcionariosCache));
  }

  if (formAdicionar) {
    formAdicionar.addEventListener("submit", enviarAdicionarFuncionario);
  }

  if (formEditar) {
    formEditar.addEventListener("submit", enviarEditarFuncionario);
  }

  await carregarFuncionariosAdmin();
}

async function iniciarFuncionario() {
  try {
    const funcionario = await buscarMeuPerfil();

    document.getElementById("funcNome").textContent = funcionario.nome;
    document.getElementById("funcEntradas").textContent = formatarNumero(funcionario.entraram);
    document.getElementById("funcPedidos").textContent = formatarNumero(funcionario.pedidos);
    document.getElementById("funcPosicao").textContent = "-";

    const link = gerarLinkCompleto(funcionario.link);
    document.getElementById("linkFuncionario").value = link;

    const badge = document.getElementById("funcStatus");
    badge.textContent = statusTexto(funcionario.entraram);
    badge.className = classeBadge(funcionario.entraram);

    renderizarRankingFuncionario([funcionario]);
  } catch (error) {
    alert(error.message);
  }
}

function renderizarRankingFuncionario(lista) {
  const rankingBody = document.getElementById("rankingBody");
  if (!rankingBody) return;

  rankingBody.innerHTML = "";

  lista.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="Posição">#${index + 1}</td>
      <td data-label="Nome">${item.nome}</td>
      <td data-label="Entradas">${formatarNumero(item.entraram)}</td>
      <td data-label="Pedidos">${formatarNumero(item.pedidos)}</td>
      <td data-label="Status">
        <span class="${classeBadge(item.entraram)}">${statusTexto(item.entraram)}</span>
      </td>
    `;

    rankingBody.appendChild(tr);
  });
}

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto);
  mostrarToast("Link copiado.", "sucesso");
}

function copiarLink() {
  const input = document.getElementById("linkFuncionario");
  if (!input) return;

  navigator.clipboard.writeText(input.value);
  mostrarToast("Link copiado.", "sucesso");
}

verificarPagina();