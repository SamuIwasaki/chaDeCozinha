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
let reservas = Array(presentes.length).fill(null);
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
      // Convert Google Sheets data to reservas array
      reservas = Array(presentes.length).fill(null);
      result.data.forEach(row => {
        const index = parseInt(row[0]); // Item index
        const nome = row[2]; // Reserved by name
        if (!isNaN(index) && index >= 0 && index < presentes.length) {
          reservas[index] = nome;
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

async function salvarReservaNoGoogleSheets(index, nome, action = 'reserve') {
  if (!GOOGLE_SHEETS_URL) {
    return salvarReservasLocal();
  }
  
  try {
    const data = {
      action: action,
      index: index,
      itemName: presentes[index].nome,
      reservedBy: nome,
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
      throw new Error('Falha ao salvar no Google Sheets');
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
    reservas = Array(presentes.length).fill(null);
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
    const div = document.createElement("div");
    div.className = "item" + (reservas[i] ? " reservado" : "");
    div.setAttribute('data-index', i);
    
    if (reservas[i]) {
      // Item reservado
      div.innerHTML = `
        <div class="item-icon">${item.icone}</div>
        <h3>${item.nome}</h3>
        <div class="reservado-info">✓ Reservado por: ${reservas[i]}</div>
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
    reservas[i] = nome;
    
    // Save to Google Sheets or localStorage
    await salvarReservaNoGoogleSheets(i, nome, 'reserve');
    
    // Update UI
    atualizarLista();
    
    // Show success message
    alert(`Presente "${presentes[i].nome}" reservado com sucesso para ${nome}!`);
  } catch (error) {
    console.error('Erro ao reservar:', error);
    // Revert local state
    reservas[i] = null;
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
  const nomeReservado = reservas[i];
  const confirmacao = confirm(`Tem certeza que deseja cancelar a reserva do item "${presentes[i].nome}" feita por ${nomeReservado}?`);
  
  if (!confirmacao) return;
  
  // Set loading state
  setItemLoading(i, true);
  const button = document.querySelector(`[data-index="${i}"] .cancelar-btn`);
  const originalText = button.textContent;
  button.textContent = 'Cancelando...';
  button.disabled = true;
  
  try {
    // Update local state
    reservas[i] = null;
    
    // Save to Google Sheets or localStorage
    await salvarReservaNoGoogleSheets(i, '', 'cancel');
    
    // Update UI
    atualizarLista();
    
    alert(`Reserva do item "${presentes[i].nome}" cancelada com sucesso!`);
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    // Revert local state
    reservas[i] = nomeReservado;
    alert('Erro ao cancelar a reserva. Tente novamente.');
  } finally {
    setItemLoading(i, false);
  }
}

// Utility Functions
function limparTodasReservas() {
  if (confirm("Tem certeza que deseja limpar todas as reservas? Esta ação não pode ser desfeita.")) {
    reservas = Array(presentes.length).fill(null);
    if (GOOGLE_SHEETS_URL) {
      // Clear Google Sheets (you might want to implement this)
      console.log("Clearing Google Sheets data...");
    }
    salvarReservasLocal();
    atualizarLista();
    alert("Todas as reservas foram removidas!");
  }
}

// Initialize the application
async function inicializar() {
  mostrarLoading();
  
  // Check if Google Sheets URL is already saved
  if (GOOGLE_SHEETS_URL) {
    document.getElementById('sheets-url').value = GOOGLE_SHEETS_URL;
    document.getElementById('connection-status').textContent = '✅ URL salva. Testando conexão...';
    document.getElementById('connection-status').style.color = '#28a745';
    
    try {
      await carregarReservasDoGoogleSheets();
    } catch (error) {
      console.log('Fallback to localStorage');
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
console.log("Use limparTodasReservas() no console para limpar todas as reservas.");
console.log("Para conectar ao Google Sheets, use o formulário na página.");

// Google Apps Script Code (to be copied to Google Apps Script)
const GOOGLE_APPS_SCRIPT_CODE = `
/*
CÓDIGO PARA GOOGLE APPS SCRIPT
================================

1. Vá para https://script.google.com
2. Crie um novo projeto
3. Cole este código no editor
4. Salve o projeto
5. Clique em "Implantar" > "Nova implantação"
6. Escolha tipo "Aplicativo da web"
7. Execute como: "Eu"
8. Quem tem acesso: "Qualquer pessoa"
9. Copie a URL do aplicativo da web
10. Cole a URL no formulário da página

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
      const sheet = getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: data.slice(1)})) // Skip header
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, error: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    
    if (data.action === 'reserve') {
      // Add or update reservation
      const existingRow = findRowByIndex(sheet, data.index);
      
      if (existingRow > 0) {
        // Update existing row
        sheet.getRange(existingRow, 3).setValue(data.reservedBy);
        sheet.getRange(existingRow, 4).setValue(data.timestamp);
      } else {
        // Add new row
        sheet.appendRow([data.index, data.itemName, data.reservedBy, data.timestamp]);
      }
    } else if (data.action === 'cancel') {
      // Remove reservation
      const existingRow = findRowByIndex(sheet, data.index);
      if (existingRow > 0) {
        sheet.deleteRow(existingRow);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Reservas');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Reservas');
    // Add headers
    sheet.getRange(1, 1, 1, 4).setValues([['Index', 'Item', 'Reservado Por', 'Data/Hora']]);
  }
  
  return sheet;
}

function findRowByIndex(sheet, index) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) { // Skip header row
    if (data[i][0] == index) {
      return i + 1; // Return 1-based row number
    }
  }
  
  return -1; // Not found
}
`;

// Export the Google Apps Script code for easy copying
window.GOOGLE_APPS_SCRIPT_CODE = GOOGLE_APPS_SCRIPT_CODE;
console.log("Código do Google Apps Script disponível em: window.GOOGLE_APPS_SCRIPT_CODE");
