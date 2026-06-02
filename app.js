// ---------- UTILITÁRIOS ----------
function calcularEnergia(tempoHoras, picoW, duracaoPicoMin, sustentadaW) {
  const duracaoPicoHoras = duracaoPicoMin / 60;
  if (tempoHoras <= duracaoPicoHoras) {
    return (tempoHoras * picoW) / 1000; // kWh
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

  const tempoIndividual = parseFloatSafe(document.getElementById('tempoIndividual').value);
  const tempoLoteTotal = parseFloatSafe(document.getElementById('tempoLoteTotal').value);
  const qtdLote = parseInt(document.getElementById('qtdLote').value) || 1;

  const consumoIndividual = calcularEnergia(tempoIndividual, pico, duracaoPico, sustentada);
  const consumoLoteTotal = calcularEnergia(tempoLoteTotal, pico, duracaoPico, sustentada);
  const consumoLotePorPeca = consumoLoteTotal / qtdLote;

  const custoEnergiaIndividual = consumoIndividual * precoKwh;
  const custoEnergiaLote = consumoLotePorPeca * precoKwh;

  const custoTotalIndividual = custoFilamento + custoEnergiaIndividual;
  const custoTotalLote = custoFilamento + custoEnergiaLote;

  // Modo escolhido
  const modo = document.getElementById('modoProducao').value;
  const custoEscolhido = modo === 'individual' ? custoTotalIndividual : custoTotalLote;

  // Margem
  const margem = parseFloatSafe(document.getElementById('margemLucro').value) / 100;

  // Taxas
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

  // Preço sugerido: (custo * (1 + margem) + taxaFixa) / (1 - taxaPercent)
  const precos = canais.map(canal => {
    const numerador = custoEscolhido * (1 + margem) + canal.taxaFixa;
    const denominador = 1 - canal.taxaPercent;
    if (denominador <= 0) return { nome: canal.nome, preco: Infinity, erro: true };
    return { nome: canal.nome, preco: numerador / denominador };
  });

  // Atualizar interface
  document.getElementById('custoFilamento').textContent = formatarMoeda(custoFilamento);
  document.getElementById('custoEnergia').textContent = formatarMoeda(modo === 'individual' ? custoEnergiaIndividual : custoEnergiaLote);
  document.getElementById('custoTotalPeca').textContent = formatarMoeda(custoEscolhido);

  document.getElementById('consumoIndividual').textContent = consumoIndividual.toFixed(3);
  document.getElementById('consumoLote').textContent = consumoLotePorPeca.toFixed(3);

  const economia = custoTotalIndividual - custoTotalLote;
  const economiaEl = document.getElementById('economiaLote');
  if (economia > 0.01) {
    economiaEl.textContent = `R$ ${formatarMoeda(economia)} mais barato no lote`;
    economiaEl.className = 'economia-positiva';
  } else if (economia < -0.01) {
    economiaEl.textContent = `R$ ${formatarMoeda(Math.abs(economia))} mais caro no lote`;
    economiaEl.className = 'economia-negativa';
  } else {
    economiaEl.textContent = 'Custo equivalente';
    economiaEl.className = '';
  }

  const precosContainer = document.getElementById('precosCanais');
  precosContainer.innerHTML = precos.map(p => {
    if (p.erro) return `<p>${p.nome}: taxa inválida</p>`;
    return `<p><strong>${p.nome}:</strong> R$ ${formatarMoeda(p.preco)}</p>`;
  }).join('');

  document.getElementById('resultados').classList.remove('oculto');

  // Guardar estado para salvar no histórico
  window._ultimoCalculo = {
    nome: document.getElementById('nomeProduto').value || 'Sem nome',
    data: new Date().toLocaleString(),
    peso, desperdicio, precoFilamento,
    precoKwh, pico, duracaoPico, sustentada,
    tempoIndividual, tempoLoteTotal, qtdLote,
    margem,
    canais,
    modo,
    custoEscolhido,
    custoFilamento,
    custoEnergia: modo === 'individual' ? custoEnergiaIndividual : custoEnergiaLote,
    precos
  };
});

// Salvar no histórico
document.getElementById('salvarHistoricoBtn').addEventListener('click', () => {
  if (window._ultimoCalculo) {
    salvarHistorico(window._ultimoCalculo);
    alert('Salvo com sucesso!');
    // Se a aba histórico estiver ativa, atualizar
    if (document.getElementById('history-tab').classList.contains('active')) {
      renderizarHistorico();
    }
  }
});

// Limpar histórico
document.getElementById('limparHistoricoBtn').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    limparHistorico();
    renderizarHistorico();
  }
});

// Renderizar histórico
function renderizarHistorico() {
  const historico = carregarHistorico();
  const container = document.getElementById('historicoLista');
  if (historico.length === 0) {
    container.innerHTML = '<p>Nenhum cálculo salvo ainda.</p>';
    return;
  }
  container.innerHTML = historico.slice().reverse().map((item, index) => {
    const idx = historico.length - 1 - index; // índice real para exclusão
    return `
      <div class="historico-item">
        <div class="historico-info">
          <strong>${item.nome}</strong> (${item.data})<br>
          Custo: R$ ${formatarMoeda(item.custoEscolhido)} |
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

// Funções globais para os botões do histórico
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
  document.getElementById('tempoIndividual').value = item.tempoIndividual;
  document.getElementById('tempoLoteTotal').value = item.tempoLoteTotal;
  document.getElementById('qtdLote').value = item.qtdLote;
  document.getElementById('margemLucro').value = item.margem * 100;
  document.getElementById('modoProducao').value = item.modo;
  document.getElementById('taxaML').value = item.canais[1].taxaPercent * 100;
  document.getElementById('fixoML').value = item.canais[1].taxaFixa;
  document.getElementById('taxaShopee').value = item.canais[2].taxaPercent * 100;
  document.getElementById('fixoShopee').value = item.canais[2].taxaFixa;
  // Mudar para aba calculadora
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="calc"]').classList.add('active');
  document.getElementById('calc-tab').classList.add('active');
  document.getElementById('history-tab').classList.remove('active');
  // Disparar cálculo automaticamente
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

// Registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registrado'))
      .catch(err => console.log('Erro no SW:', err));
  });
}
