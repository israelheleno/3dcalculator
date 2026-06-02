// ---------- UTILITÁRIOS ----------
function strParaHoras(str) {
  if (!str || !str.includes(':')) return 0;
  const partes = str.split(':');
  const horas = parseInt(partes[0]) || 0;
  const minutos = parseInt(partes[1]) || 0;
  return horas + minutos / 60;
}

function horasParaStr(horas) {
  if (isNaN(horas) || horas < 0) return '0:00';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function calcularEnergia(tempoHoras, picoW, duracaoPicoMin, sustentadaW) {
  const duracaoPicoHoras = duracaoPicoMin / 60;
  if (tempoHoras <= duracaoPicoHoras) {
    return (tempoHoras * picoW) / 1000;
  }
  const energiaPico = (duracaoPicoHoras * picoW) / 1000;
  const energiaRestante = ((tempoHoras - duracaoPicoHoras) * sustentadaW) / 1000;
  return energiaPico + energiaRestante;
}

function formatarMoeda(valor) {
  return valor.toFixed(2).replace('.', ',');
}

function parseFloatSafe(val) {
  const v = parseFloat(val);
  return isNaN(v) ? 0 : v;
}

// ---------- INTERFACE DINÂMICA DOS TEMPOS ----------
const modoSelect = document.getElementById('modoProducao');
const containerIndividual = document.getElementById('tempoIndividualContainer');
const containerLote = document.getElementById('tempoLoteContainer');
const tempoMedioLoteSpan = document.getElementById('tempoMedioLote');

function atualizarCamposTempo() {
  const modo = modoSelect.value;
  if (modo === 'individual') {
    containerIndividual.style.display = 'block';
    containerLote.style.display = 'none';
  } else {
    containerIndividual.style.display = 'none';
    containerLote.style.display = 'block';
    calcularTempoMedioLote();
  }
}

function calcularTempoMedioLote() {
  const qtd = parseInt(document.getElementById('qtdLote').value) || 1;
  const tempoTotal = strParaHoras(document.getElementById('tempoLoteTotalStr').value);
  const tempoMedio = qtd > 0 ? tempoTotal / qtd : 0;
  if (tempoMedioLoteSpan) {
    tempoMedioLoteSpan.textContent = horasParaStr(tempoMedio);
  }
}

modoSelect.addEventListener('change', atualizarCamposTempo);
document.getElementById('qtdLote').addEventListener('input', calcularTempoMedioLote);
document.getElementById('tempoLoteTotalStr').addEventListener('input', calcularTempoMedioLote);

// Inicializa a visibilidade e o cálculo do tempo médio se já estiver em lote
atualizarCamposTempo();

// ---------- ARMAZENAMENTO ----------
function salvarHistorico(registro) {
  const historico = JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
  historico.push(registro);
  localStorage.setItem('calc3d_historico', JSON.stringify(historico));
}

function carregarHistorico() {
  return JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
}

function limparHistorico() {
  localStorage.removeItem('calc3d_historico');
}

// ---------- INTERFACE DE ABAS ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });
    if (tab === 'history') {
      renderizarHistorico();
    }
  });
});

// ---------- CÁLCULO ----------
document.getElementById('calcularBtn').addEventListener('click', () => {
  // Filamento
  const peso = parseFloatSafe(document.getElementById('peso').value);
  const desperdicio = parseFloatSafe(document.getElementById('desperdicio').value) / 100;
  const precoFilamento = parseFloatSafe(document.getElementById('precoFilamento').value);
  const pesoFinal = peso * (1 + desperdicio);
  const custoFilamento = (pesoFinal / 1000) * precoFilamento;

  // Energia
  const precoKwh = parseFloatSafe(document.getElementById('precoKwh').value);
  const pico = parseFloatSafe(document.getElementById('potenciaPico').value);
  const duracaoPico = parseFloatSafe(document.getElementById('duracaoPico').value);
  const sustentada = parseFloatSafe(document.getElementById('potenciaSustentada').value);

  const modo = modoSelect.value;
  let tempoHoras = 0;
  let qtdLote = 1;
  let custoEnergiaEscolhido = 0;
  let consumoIndividual = 0;
  let consumoLotePorPeca = 0;

  if (modo === 'individual') {
    tempoHoras = strParaHoras(document.getElementById('tempoIndividualStr').value);
    consumoIndividual = calcularEnergia(tempoHoras, pico, duracaoPico, sustentada);
    custoEnergiaEscolhido = consumoIndividual * precoKwh;
  } else {
    qtdLote = parseInt(document.getElementById('qtdLote').value) || 1;
    const tempoLoteTotal = strParaHoras(document.getElementById('tempoLoteTotalStr').value);
    const consumoLoteTotal = calcularEnergia(tempoLoteTotal, pico, duracaoPico, sustentada);
    consumoLotePorPeca = consumoLoteTotal / qtdLote;
    custoEnergiaEscolhido = consumoLotePorPeca * precoKwh;

    // Para comparação, também calculamos o consumo individual caso o campo esteja preenchido
    const tempoIndividualStr = document.getElementById('tempoIndividualStr').value;
    if (tempoIndividualStr) {
      const tempoInd = strParaHoras(tempoIndividualStr);
      consumoIndividual = calcularEnergia(tempoInd, pico, duracaoPico, sustentada);
    }
  }

  const custoTotalPeca = custoFilamento + custoEnergiaEscolhido;

  // Exibição dos resultados
  document.getElementById('custoFilamento').textContent = formatarMoeda(custoFilamento);
  document.getElementById('custoEnergia').textContent = formatarMoeda(custoEnergiaEscolhido);
  document.getElementById('custoTotalPeca').textContent = formatarMoeda(custoTotalPeca);

  document.getElementById('consumoIndividual').textContent = consumoIndividual ? consumoIndividual.toFixed(3) : '-';
  document.getElementById('consumoLote').textContent = consumoLotePorPeca ? consumoLotePorPeca.toFixed(3) : (modo === 'individual' ? '-' : '0.000');

  // Mensagem de economia
  const economiaEl = document.getElementById('economiaLote');
  if (modo === 'lote' && consumoIndividual > 0) {
    const custoInd = custoFilamento + consumoIndividual * precoKwh;
    const economia = custoInd - custoTotalPeca;
    if (economia > 0.01) {
      economiaEl.textContent = `R$ ${formatarMoeda(economia)} mais barato que individual`;
      economiaEl.className = 'economia-positiva';
    } else if (economia < -0.01) {
      economiaEl.textContent = `R$ ${formatarMoeda(Math.abs(economia))} mais caro que individual`;
      economiaEl.className = 'economia-negativa';
    } else {
      economiaEl.textContent = 'Custo equivalente ao individual';
      economiaEl.className = '';
    }
  } else if (modo === 'individual') {
    economiaEl.textContent = 'Modo individual selecionado';
    economiaEl.className = '';
  } else {
    economiaEl.textContent = 'Preencha o tempo individual para comparar';
    economiaEl.className = '';
  }

  // Margem e taxas
  const margem = parseFloatSafe(document.getElementById('margemLucro').value) / 100;
  const canais = [
    {
      nome: 'Venda Direta',
      taxaPercent: parseFloatSafe(document.getElementById('taxaDireta').value) / 100,
      taxaFixa: parseFloatSafe(document.getElementById('fixoDireta').value)
    },
    {
      nome: 'Mercado Livre',
      taxaPercent: parseFloatSafe(document.getElementById('taxaML').value) / 100,
      taxaFixa: parseFloatSafe(document.getElementById('fixoML').value)
    },
    {
      nome: 'Shopee',
      taxaPercent: parseFloatSafe(document.getElementById('taxaShopee').value) / 100,
      taxaFixa: parseFloatSafe(document.getElementById('fixoShopee').value)
    }
  ];

  const precos = canais.map(canal => {
    const numerador = custoTotalPeca * (1 + margem) + canal.taxaFixa;
    const denominador = 1 - canal.taxaPercent;
    if (denominador <= 0) return { nome: canal.nome, preco: Infinity, erro: true };
    return { nome: canal.nome, preco: numerador / denominador };
  });

  const precosContainer = document.getElementById('precosCanais');
  precosContainer.innerHTML = precos.map(p => {
    if (p.erro) return `<p>${p.nome}: taxa inválida</p>`;
    return `<p><strong>${p.nome}:</strong> R$ ${formatarMoeda(p.preco)}</p>`;
  }).join('');

  // Mostrar resultados
  document.getElementById('resultados').classList.remove('oculto');

  // Salvar estado para histórico
  window._ultimoCalculo = {
    nome: document.getElementById('nomeProduto').value || 'Sem nome',
    data: new Date().toLocaleString(),
    peso, desperdicio, precoFilamento,
    precoKwh, pico, duracaoPico, sustentada,
    modo,
    tempoIndividualStr: document.getElementById('tempoIndividualStr').value,
    tempoLoteTotalStr: modo === 'lote' ? document.getElementById('tempoLoteTotalStr').value : '',
    qtdLote: modo === 'lote' ? qtdLote : 1,
    margem,
    canais,
    custoTotalPeca,
    custoFilamento,
    custoEnergia: custoEnergiaEscolhido,
    precos
  };
});

// ---------- HISTÓRICO ----------
document.getElementById('salvarHistoricoBtn').addEventListener('click', () => {
  if (window._ultimoCalculo) {
    salvarHistorico(window._ultimoCalculo);
    alert('Salvo com sucesso!');
    if (document.getElementById('history-tab').classList.contains('active')) {
      renderizarHistorico();
    }
  }
});

document.getElementById('limparHistoricoBtn').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    limparHistorico();
    renderizarHistorico();
  }
});

function renderizarHistorico() {
  const historico = carregarHistorico();
  const container = document.getElementById('historicoLista');
  if (historico.length === 0) {
    container.innerHTML = '<p>Nenhum cálculo salvo ainda.</p>';
    return;
  }
  container.innerHTML = historico.slice().reverse().map((item, index) => {
    const idx = historico.length - 1 - index;
    return `
      <div class="historico-item">
        <div class="historico-info">
          <strong>${item.nome}</strong> (${item.data})<br>
          Custo: R$ ${formatarMoeda(item.custoTotalPeca)} |
          Venda Direta: R$ ${formatarMoeda(item.precos[0].preco)} |
          ML: R$ ${formatarMoeda(item.precos[1].preco)} |
          Shopee: R$ ${formatarMoeda(item.precos[2].preco)}
        </div>
        <div class="historico-acoes">
          <button onclick="carregarDeHistorico(${idx})">📂 Carregar</button>
          <button class="btn-perigo" onclick="excluirDoHistorico(${idx})">❌</button>
        </div>
      </div>
    `;
  }).join('');
}

window.carregarDeHistorico = function(index) {
  const historico = carregarHistorico();
  const item = historico[index];
  if (!item) return;

  document.getElementById('nomeProduto').value = item.nome;
  document.getElementById('peso').value = item.peso;
  document.getElementById('desperdicio').value = item.desperdicio * 100;
  document.getElementById('precoFilamento').value = item.precoFilamento;
  document.getElementById('precoKwh').value = item.precoKwh;
  document.getElementById('potenciaPico').value = item.pico;
  document.getElementById('duracaoPico').value = item.duracaoPico;
  document.getElementById('potenciaSustentada').value = item.sustentada;

  modoSelect.value = item.modo;
  document.getElementById('tempoIndividualStr').value = item.tempoIndividualStr || '0:00';
  if (item.modo === 'lote') {
    document.getElementById('qtdLote').value = item.qtdLote || 2;
    document.getElementById('tempoLoteTotalStr').value = item.tempoLoteTotalStr || '0:00';
  }
  atualizarCamposTempo();
  if (item.modo === 'lote') calcularTempoMedioLote();

  document.getElementById('margemLucro').value = item.margem * 100;
  document.getElementById('taxaML').value = item.canais[1].taxaPercent * 100;
  document.getElementById('fixoML').value = item.canais[1].taxaFixa;
  document.getElementById('taxaShopee').value = item.canais[2].taxaPercent * 100;
  document.getElementById('fixoShopee').value = item.canais[2].taxaFixa;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="calc"]').classList.add('active');
  document.getElementById('calc-tab').classList.add('active');
  document.getElementById('history-tab').classList.remove('active');

  document.getElementById('calcularBtn').click();
};

window.excluirDoHistorico = function(index) {
  if (confirm('Excluir este registro?')) {
    const historico = carregarHistorico();
    historico.splice(index, 1);
    localStorage.setItem('calc3d_historico', JSON.stringify(historico));
    renderizarHistorico();
  }
};

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registrado'))
      .catch(err => console.log('Erro no SW:', err));
  });
}
