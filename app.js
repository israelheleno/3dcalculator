// ---------- UTILITÁRIOS ----------
function strParaHoras(horasStr, minutosStr) {
  const h = parseInt(horasStr) || 0;
  const m = parseInt(minutosStr) || 0;
  return h + m / 60;
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

// Função de compatibilidade — o zero automático é tratado em strParaHoras
function setupTempoAutoZero(horaInput, minutoInput) {
  // intencionalmente vazia
}

// ---------- INTERFACE DINÂMICA DOS TEMPOS ----------
const modoSelect = document.getElementById('modoProducao');
const containerIndividual = document.getElementById('tempoIndividualContainer');
const containerLote = document.getElementById('tempoLoteContainer');
const tempoMedioLoteSpan = document.getElementById('tempoMedioLote');

const tempoIndividualH = document.getElementById('tempoIndividualH');
const tempoIndividualM = document.getElementById('tempoIndividualM');
const tempoLoteTotalH = document.getElementById('tempoLoteTotalH');
const tempoLoteTotalM = document.getElementById('tempoLoteTotalM');

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
  const tempoTotal = strParaHoras(tempoLoteTotalH.value, tempoLoteTotalM.value);
  const tempoMedio = qtd > 0 ? tempoTotal / qtd : 0;
  if (tempoMedioLoteSpan) {
    tempoMedioLoteSpan.textContent = horasParaStr(tempoMedio);
  }
}

modoSelect.addEventListener('change', atualizarCamposTempo);
document.getElementById('qtdLote').addEventListener('input', calcularTempoMedioLote);
tempoLoteTotalH.addEventListener('input', calcularTempoMedioLote);
tempoLoteTotalM.addEventListener('input', calcularTempoMedioLote);

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
  const peso = parseFloatSafe(document.getElementById('peso').value);
  const desperdicio = parseFloatSafe(document.getElementById('desperdicio').value) / 100;
  const precoFilamento = parseFloatSafe(document.getElementById('precoFilamento').value);
  const pesoFinal = peso * (1 + desperdicio);
  const custoFilamento = (pesoFinal / 1000) * precoFilamento;

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
    tempoHoras = strParaHoras(tempoIndividualH.value, tempoIndividualM.value);
    consumoIndividual = calcularEnergia(tempoHoras, pico, duracaoPico, sustentada);
    custoEnergiaEscolhido = consumoIndividual * precoKwh;
  } else {
    qtdLote = parseInt(document.getElementById('qtdLote').value) || 1;
    const tempoLoteTotal = strParaHoras(tempoLoteTotalH.value, tempoLoteTotalM.value);
    const consumoLoteTotal = calcularEnergia(tempoLoteTotal, pico, duracaoPico, sustentada);
    consumoLotePorPeca = consumoLoteTotal / qtdLote;
    custoEnergiaEscolhido = consumoLotePorPeca * precoKwh;

    const tempoInd = strParaHoras(tempoIndividualH.value, tempoIndividualM.value);
    if (tempoInd > 0) {
      consumoIndividual = calcularEnergia(tempoInd, pico, duracaoPico, sustentada);
    }
  }

  const custoTotalPeca = custoFilamento + custoEnergiaEscolhido;

  document.getElementById('custoFilamento').textContent = formatarMoeda(custoFilamento);
  document.getElementById('custoEnergia').textContent = formatarMoeda(custoEnergiaEscolhido);
  document.getElementById('custoTotalPeca').textContent = formatarMoeda(custoTotalPeca);

  document.getElementById('consumoIndividual').textContent = consumoIndividual ? consumoIndividual.toFixed(3) : '-';
  document.getElementById('consumoLote').textContent = consumoLotePorPeca ? consumoLotePorPeca.toFixed(3) : (modo === 'individual' ? '-' : '0.000');

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

  document.getElementById('resultados').classList.remove('oculto');
  document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });

  window._ultimoCalculo = {
    nome: document.getElementById('nomeProduto').value || 'Sem nome',
    data: new Date().toLocaleString(),
    peso, desperdicio, precoFilamento,
    precoKwh, pico, duracaoPico, sustentada,
    modo,
    tempoIndividualH: tempoIndividualH.value,
    tempoIndividualM: tempoIndividualM.value,
    tempoLoteTotalH: modo === 'lote' ? tempoLoteTotalH.value : '0',
    tempoLoteTotalM: modo === 'lote' ? tempoLoteTotalM.value : '0',
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
  const msgEl = document.getElementById('msgSalvo');
  if (window._ultimoCalculo) {
    salvarHistorico(window._ultimoCalculo);
    msgEl.classList.remove('oculto');
    setTimeout(() => msgEl.classList.add('oculto'), 2500);
    if (document.getElementById('history-tab').classList.contains('active')) {
      renderizarHistorico();
    }
  } else {
    alert('Nenhum cálculo realizado. Clique em "Calcular" primeiro.');
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
    container.innerHTML = '<p class="historico-vazio">📋 Nenhum cálculo salvo ainda.<br><small>Faça um cálculo e clique em "Salvar no histórico".</small></p>';
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
  document.getElementById('tempoIndividualH').value = item.tempoIndividualH || '';
  document.getElementById('tempoIndividualM').value = item.tempoIndividualM || '';
  if (item.modo === 'lote') {
    document.getElementById('qtdLote').value = item.qtdLote || 2;
    document.getElementById('tempoLoteTotalH').value = item.tempoLoteTotalH || '';
    document.getElementById('tempoLoteTotalM').value = item.tempoLoteTotalM || '';
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
    navigator.serviceWorker.register('/3dcalculator/sw.js')
      .then(reg => console.log('SW registrado com escopo:', reg.scope))
      .catch(err => console.log('Erro no SW:', err));
  });
}
