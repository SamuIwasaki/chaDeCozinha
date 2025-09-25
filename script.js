// Kitchen Shower Registry with Google Sheets Integration
// Main JavaScript file

const presentes = [
  { nome: "Escorredor de macarrão", icone: "🍝" },
  { nome: "Escorredor de arroz", icone: "🍚" },
  { nome: "Tábua de madeira", icone: "🪵" },
  { nome: "Tábua de plástico", icone: "📋" },
  { nome: "Tábua de vidro", icone: "🔷" },
  { nome: "Escorredor de louça", icone: "🍽️" },
  { nome: "Kit pia (lixeira, porta detergente)", icone: "🧽" },
  { nome: "Rodinho de pia", icone: "🧹" },
  { nome: "Ralador", icone: "🧀" },
  { nome: "Descascador", icone: "🥔" },
  { nome: "Batedor de ovos", icone: "🥚" },
  { nome: "Concha", icone: "🥄" },
  { nome: "Escumadeira", icone: "🍳" },
  { nome: "Pegador de massas", icone: "🍝" },
  { nome: "Espátula", icone: "🍳" },
  { nome: "Colher de pau", icone: "🥄" },
  { nome: "Colheres medidoras", icone: "📏" },
  { nome: "Peneira", icone: "⚪" },
  { nome: "Funil", icone: "🔽" },
  { nome: "Saladeira", icone: "🥗" },
  { nome: "Fruteira", icone: "🍎" },
  { nome: "Jarra de suco", icone: "🥤" },
  { nome: "Luva térmica", icone: "🧤" },
  { nome: "Panos de prato", icone: "🧽" },
  { nome: "Jogo americano", icone: "🍽️" },
  { nome: "Toalha de mesa", icone: "🏠" },
  { nome: "Centrífuga de salada", icone: "🥬" },
  { nome: "Espremedor de alho", icone: "🧄" },
  { nome: "Pote de vidro hermético", icone: "🫙" },
  { nome: "Potes de condimentos", icone: "🧂" },
  { nome: "Potes de plástico", icone: "📦" },
  { nome: "Potes de vidro", icone: "🫙" },
  { nome: "Potes de mantimentos", icone: "🏺" },
  { nome: "Assadeira redonda", icone: "🍰" },
  { nome: "Assadeira retangular", icone: "🍞" },
  { nome: "Assadeira redonda com furo", icone: "🍩" },
  { nome: "Baldes", icone: "🪣" },
  { nome: "Bacias", icone: "🥣" },
  { nome: "Vassoura", icone: "🧹" },
  { nome: "Rodo", icone: "🧽" },
  { nome: "Varal", icone: "👕" },
  { nome: "Cabide", icone: "👔" },
  { nome: "Varal com prendedores", icone: "📎" },
  { nome: "Cesto de roupa", icone: "🧺" }
];

// Configuration
let GOOGLE_SHEETS_URL = localStorage.getItem('googleSheetsUrl') || '';
// 'reservas' agora será um mapa de nome do item -> nome do reservador
let reservas = {}; 
let isGoogleSheetsConnected = false;

// Google Sheets Integration Functions
async function conectarGoogleSheets() {
  const url = document.getElementById('sheets-url').value.trim();
  const statusElement = document.getElementById('connection-status');
  
  if (!url) {
    statusElement.textContent = '❌ Por favor, insira a URL do Google Apps Script';
    statusElement.style.color = '#dc3545';
    return;
  }
  
  try {
    statusElement.textContent = '⏳ Testando conexão...';
    statusElement.style.color = '#ffc107';
    
    // Test connection
    const response = await fetch(url + '?action=test');
    const result = await response.json();
    
    if (result.success) {
      GOOGLE_SHEETS_URL = url;
      localStorage.setItem('googleSheetsUrl', url);
      isGoogleSheetsConnected = true;
      
      statusElement.textContent = '✅ Conectado ao Google Sheets com sucesso!';
      statusElement.style.color = '#28a745';
      
      // Load data from Google Sheets
      await carregarReservasDoGoogleSheets();
      atualizarLista();
    } else {
      throw new Error('Conexão falhou');
    }
  } catch (error) {
    console.error('Erro ao conectar:', error);
    statusElement.textContent = '❌ Erro na conexão. Verifique a URL e tente novamente.';
    statusElement.style.color = '#dc3545';
  }
}

async function carregarReservasDoGoogleSheets() {
  if (!GOOGLE_SHEETS_URL) {
    return carregarReservasLocal();
  }
  
  try {
    const response = await fetch(GOOGLE_SHEETS_URL + '?action=get');
    const result = await response.json();
    
    if (result.success && result.data) {
      // Convert Google Sheets data to reservas object (item name -> reserved by name)
      reservas = {};
      result.data.forEach(row => {
        const itemName = row[0]; // Item name from Sheets (coluna A)
        const reservedBy = row[1]; // Reserved by name from Sheets (coluna B)
        if (itemName && reservedBy) {
          reservas[itemName] = reservedBy;
        }
      });
      isGoogleSheetsConnected = true;
    } else {
      throw new Error('Falha ao carregar dados');
    }
  } catch (error) {
    console.error('Erro ao carregar do Google Sheets:', error);
    // Fallback to localStorage
    carregarReservasLocal();
  }
}

async function salvarReservaNoGoogleSheets(itemName, nome, action = 'reserve') {
  if (!GOOGLE_SHEETS_URL) {
    console.warn("URL do Google Sheets não configurada. Salvando localmente.");
    return salvarReservasLocal();
  }
  
  try {
    const data = {
      action: action,
      itemName: itemName,
      reservedBy: nome, // will be empty string if action is 'cancel'
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Falha ao salvar no Google Sheets: ' + result.error);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar no Google Sheets:', error);
    // Fallback to localStorage
    salvarReservasLocal();
    return false;
  }
}

// Local Storage Functions (Fallback)
function carregarReservasLocal() {
  const reservasSalvas = localStorage.getItem('reservasChaCozinha');
  if (reservasSalvas) {
    reservas = JSON.parse(reservasSalvas);
  } else {
    reservas = {}; // Initialize as empty object
  }
}

function salvarReservasLocal() {
  localStorage.setItem('reservasChaCozinha', JSON.stringify(reservas));
}

// UI Functions
function mostrarLoading() {
  document.getElementById('loading-indicator').style.display = 'block';
}

function esconderLoading() {
  document.getElementById('loading-indicator').style.display = 'none';
}

function setItemLoading(index, loading) {
  const item = document.querySelector(`[data-index="${index}"]`);
  if (item) {
    if (loading) {
      item.classList.add('item-loading');
    } else {
      item.classList.remove('item-loading');
    }
  }
}

function atualizarLista() {
  const container = document.getElementById("lista");
  container.innerHTML = "";
  
  presentes.forEach((item, i) => {
    const isReserved = reservas[item.nome] !== undefined && reservas[item.nome] !== null && reservas[item.nome] !== '';
    const reservedByName = reservas[item.nome];

    const div = document.createElement("div");
    div.className = "item" + (isReserved ? " reservado" : "");
    div.setAttribute('data-index', i); // Keep index for UI, but use item.nome for backend
    
    if (isReserved) {
      // Item reservado
      div.innerHTML = `
        <div class="item-icon">${item.icone}</div>
        <h3>${item.nome}</h3>
        <div class="reservado-info">✓ Reservado por: ${reservedByName}</div>
        <button class="cancelar-btn" onclick="cancelarReserva(${i})">Cancelar Reserva</button>
      `;
    } else {
      // Item disponível
      div.innerHTML = `
        <div class="item-icon">${item.icone}</div>
        <h3>${item.nome}</h3>
        <input type="text" id="nome-${i}" placeholder="Digite seu nome">
        <button onclick="reservar(${i})">Reservar</button>
      `;
    }
    
    container.appendChild(div);
  });
}

async function reservar(i) {
  const nome = document.getElementById(`nome-${i}`).value.trim();
  const itemName = presentes[i].nome; // Get the actual item name
  
  if (!nome) {
    alert("Digite seu nome para reservar.");
    return;
  }
  
  if (nome.length < 2) {
    alert("Digite um nome válido (pelo menos 2 caracteres).");
    return;
  }
  
  // Set loading state
  setItemLoading(i, true);
  const button = document.querySelector(`[data-index="${i}"] button`);
  const originalText = button.textContent;
  button.textContent = 'Reservando...';
  button.disabled = true;
  
  try {
    // Update local state
    reservas[itemName] = nome;
    
    // Save to Google Sheets or localStorage
    const savedSuccessfully = await salvarReservaNoGoogleSheets(itemName, nome, 'reserve');
    
    if (!savedSuccessfully) {
      throw new Error("Falha ao salvar a reserva.");
    }

    // Update UI
    atualizarLista();
    
    // Show success message
    alert(`Presente "${itemName}" reservado com sucesso para ${nome}!`);
  } catch (error) {
    console.error('Erro ao reservar:', error);
    // Revert local state if save failed
    delete reservas[itemName]; 
    alert('Erro ao reservar o presente. Tente novamente.');
  } finally {
    setItemLoading(i, false);
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function cancelarReserva(i) {
  const itemName = presentes[i].nome; // Get the actual item name
  const nomeReservado = reservas[itemName];
  const confirmacao = confirm(`Tem certeza que deseja cancelar a reserva do item "${itemName}" feita por ${nomeReservado}?`);
  
  if (!confirmacao) return;
  
  // Set loading state
  setItemLoading(i, true);
  const button = document.querySelector(`[data-index="${i}"] .cancelar-btn`);
  const originalText = button.textContent;
  button.textContent = 'Cancelando...';
  button.disabled = true;
  
  try {
    // Update local state
    delete reservas[itemName];
    
    // Save to Google Sheets or localStorage (empty name to clear)
    const canceledSuccessfully = await salvarReservaNoGoogleSheets(itemName, '', 'cancel');
    
    if (!canceledSuccessfully) {
      throw new Error("Falha ao cancelar a reserva.");
    }

    // Update UI
    atualizarLista();
    
    alert(`Reserva do item "${itemName}" cancelada com sucesso!`);
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    // Revert local state if cancel failed
    reservas[itemName] = nomeReservado; 
    alert('Erro ao cancelar a reserva. Tente novamente.');
  } finally {
    setItemLoading(i, false);
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

// Utility Functions
function limparTodasReservas() {
  if (confirm("Tem certeza que deseja limpar todas as reservas? Esta ação não pode ser desfeita.")) {
    reservas = {}; // Clear local state
    if (GOOGLE_SHEETS_URL) {
      // Optionally, implement a 'clearAll' action in Google Apps Script
      // For simplicity, this currently only clears local state and requires manual sheet clearing
      console.log("Para limpar o Google Sheets, você precisará apagar manualmente as linhas na planilha 'Itens' ou implementar uma função 'clearAll' no Apps Script.");
    }
    salvarReservasLocal();
    atualizarLista();
    alert("Todas as reservas foram removidas (apenas localmente).");
  }
}

// Initialize the application
async function inicializar() {
  mostrarLoading();
  
  // Check if Google Sheets URL is already saved
  if (GOOGLE_SHEETS_URL) {
    document.getElementById('sheets-url').value = GOOGLE_SHEETS_URL;
    document.getElementById('connection-status').textContent = '✅ URL salva. Tentando conectar...';
    document.getElementById('connection-status').style.color = '#28a745';
    
    try {
      await carregarReservasDoGoogleSheets();
    } catch (error) {
      console.log('Erro ao carregar do Google Sheets, fallback para localStorage:', error);
      document.getElementById('connection-status').textContent = '⚠️ Erro ao carregar do Sheets, usando dados locais.';
      document.getElementById('connection-status').style.color = '#ffc107';
      carregarReservasLocal();
    }
  } else {
    carregarReservasLocal();
  }
  
  atualizarLista();
  esconderLoading();
}

// Make functions globally accessible for onclick handlers
window.reservar = reservar;
window.cancelarReserva = cancelarReserva;
window.conectarGoogleSheets = conectarGoogleSheets;
window.limparTodasReservas = limparTodasReservas;

// Event Listeners
document.addEventListener('DOMContentLoaded', inicializar);

document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && e.target.type === 'text') {
    const id = e.target.id;
    if (id.startsWith('nome-')) {
      const index = parseInt(id.split('-')[1]);
      if (!isNaN(index)) {
        reservar(index);
      }
    } else if (id === 'sheets-url') {
      conectarGoogleSheets();
    }
  }
});

// Console utilities for debugging
console.log("Sistema de reservas carregado.");
console.log("Use limparTodasReservas() no console para limpar todas as reservas (localmente).");
console.log("Para conectar ao Google Sheets, use o formulário na página.");

// Google Apps Script Code (to be copied to Google Apps Script)
const GOOGLE_APPS_SCRIPT_CODE = `
/*
CÓDIGO PARA GOOGLE APPS SCRIPT
================================

1. Crie uma nova planilha no Google Sheets e nomeie-a.
2. Crie uma aba (planilha) dentro dela e nomeie-a "Itens".
3. Na primeira linha da aba "Itens", adicione os cabeçalhos:
   Coluna A: "Item"
   Coluna B: "Reserva"
4. Popule a coluna "Item" (Coluna A) com os nomes dos presentes.
   Ex:
   Item                  Reserva
   Escorredor de macarrão
   Escorredor de arroz
   Tábua de madeira
   ... (e assim por diante com todos os seus presentes)

5. Vá para https://script.google.com
6. Crie um novo projeto.
7. Cole ESTE CÓDIGO (o que está dentro destas aspas gigantes) no editor.
8. Salve o projeto.
9. Clique em "Implantar" > "Nova implantação".
10. Escolha tipo "Aplicativo da web".
11. Execute como: "Eu".
12. Quem tem acesso: "Qualquer pessoa".
13. Copie a URL do aplicativo da web.
14. Cole a URL no formulário da página do seu site.

CÓDIGO:
*/

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'test') {
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Conexão OK'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'get') {
    try {
      const sheet = getSheetByName('Itens'); // Procura pela planilha "
