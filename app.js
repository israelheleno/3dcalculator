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

// ---------- CÁLCULO (Calculadora) ----------
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

    const tempoIndividualStr = document.getElementById('tempoIndividualStr').value;
    if (tempoIndividualStr) {
      const tempoInd = strParaHoras(tempoIndividualStr);
      consumoIndividual = calcularEnergia(tempoInd, pico, duracaoPico, sustentada);
    }
  }

  const custoTotalPeca = custoFilamento + custoEnergiaEscolhido;

  // Exibição
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
    { nome: 'Venda Direta', taxaPercent: 0, taxaFixa: 0 },
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

  document.getElementById('precosCanais').innerHTML = precos.map(p => {
    if (p.erro) return `<p>${p.nome}: taxa inválida</p>`;
    return `<p><strong>${p.nome}:</strong> R$ ${formatarMoeda(p.preco)}</p>`;
  }).join('');

  document.getElementById('resultados').classList.remove('oculto');

  window._ultimoCalculo = {
    tipo: 'calculadora',
    nome: document.getElementById('nomeProduto').value || 'Sem nome',
    data: new Date().toLocaleString(),
    custoTotalPeca,
    precos,
    detalhes: {
      peso, desperdicio, precoFilamento,
      precoKwh, pico, duracaoPico, sustentada,
      modo, custoFilamento, custoEnergia: custoEnergiaEscolhido
    }
  };
});

// ---------- CÁLCULO REVERSO ----------
document.getElementById('calcularReversoBtn').addEventListener('click', () => {
  // Canal e preço
  const canal = document.getElementById('revCanal').value;
  const precoVenda = parseFloatSafe(document.getElementById('revPrecoVenda').value);
  const taxaPercent = parseFloatSafe(document.getElementById('revTaxaPercent').value) / 100;
  const taxaFixa = parseFloatSafe(document.getElementById('revTaxaFixa').value);

  // Custo de produção
  const peso = parseFloatSafe(document.getElementById('revPeso').value);
  const desperdicio = parseFloatSafe(document.getElementById('revDesperdicio').value) / 100;
  const precoFilamento = parseFloatSafe(document.getElementById('revPrecoFilamento').value);
  const tempoStr = document.getElementById('revTempoStr').value;
  const precoKwh = parseFloatSafe(document.getElementById('revPrecoKwh').value);
  const pico = parseFloatSafe(document.getElementById('revPotenciaPico').value);
  const duracaoPico = parseFloatSafe(document.getElementById('revDuracaoPico').value);
  const sustentada = parseFloatSafe(document.getElementById('revPotenciaSustentada').value);

  // Cálculo do custo
  const pesoFinal = peso * (1 + desperdicio);
  const custoFilamento = (pesoFinal / 1000) * precoFilamento;
  const tempoHoras = strParaHoras(tempoStr);
  const consumoEnergia = calcularEnergia(tempoHoras, pico, duracaoPico, sustentada);
  const custoEnergia = consumoEnergia * precoKwh;
  const custoTotalProducao = custoFilamento + custoEnergia;

  // Cálculo do valor líquido da venda
  const taxas = precoVenda * taxaPercent + taxaFixa;
  const valorLiquido = precoVenda - taxas;
  const lucro = valorLiquido - custoTotalProducao;
  const margemLucro = custoTotalProducao > 0 ? (lucro / custoTotalProducao) * 100 : 0;

  // Exibição
  document.getElementById('revCustoFilamento').textContent = formatarMoeda(custoFilamento);
  document.getElementById('revCustoEnergia').textContent = formatarMoeda(custoEnergia);
  document.getElementById('revCustoTotal').textContent = formatarMoeda(custoTotalProducao);
  document.getElementById('revPrecoVendaDisplay').textContent = formatarMoeda(precoVenda);
  document.getElementById('revTaxasCobradas').textContent = formatarMoeda(taxas);
  document.getElementById('revValorLiquido').textContent = formatarMoeda(valorLiquido);
  document.getElementById('revLucroLiquido').textContent = formatarMoeda(lucro);
  document.getElementById('revMargemLucro').textContent = margemLucro.toFixed(1);

  const valePenaEl = document.getElementById('revValePena');
  const indicadorTitulo = document.getElementById('revIndicadorTitulo');
  if (lucro > 0) {
    valePenaEl.textContent = '🟢 Vale a pena produzir!';
    valePenaEl.style.color = '#4ade80';
    indicadorTitulo.textContent = '📈 Resultado Positivo';
  } else if (lucro < 0) {
    valePenaEl.textContent = '🔴 Prejuízo! Não vale a pena.';
    valePenaEl.style.color = '#f87171';
    indicadorTitulo.textContent = '📉 Resultado Negativo';
  } else {
    valePenaEl.textContent = '⚖️ Empate técnico';
    valePenaEl.style.color = '#fbbf24';
    indicadorTitulo.textContent = '📊 Resultado Neutro';
  }

  document.getElementById('resultadosReverso').classList.remove('oculto');

  // Guardar estado
  window._ultimoCalculoReverso = {
    tipo: 'reverso',
    nome: `Reverso ${new Date().toLocaleString()}`,
    data: new Date().toLocaleString(),
    canal,
    precoVenda,
    custoTotalProducao,
    lucro,
    margemLucro,
    detalhes: { peso, desperdicio, precoFilamento, tempoStr, precoKwh, pico, duracaoPico, sustentada, custoFilamento, custoEnergia, taxaPercent, taxaFixa }
  };
});

// Salvar reverso no histórico
document.getElementById('salvarHistoricoReversoBtn').addEventListener('click', () => {
  if (window._ultimoCalculoReverso) {
    salvarHistorico(window._ultimoCalculoReverso);
    alert('Salvo no histórico!');
    if (document.getElementById('history-tab').classList.contains('active')) {
      renderizarHistorico();
    }
  }
});

// Salvar calculadora no histórico
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
    const isReverso = item.tipo === 'reverso';
    const emoji = isReverso ? '🔄' : '🧵';
    const classeExtra = isReverso ? 'reverso-item' : '';
    let conteudo = '';
    if (isReverso) {
      conteudo = `
        ${emoji} <strong>Reverso</strong> (${item.data})<br>
        Canal: ${item.canal} | Preço venda: R$ ${formatarMoeda(item.precoVenda)}<br>
        Custo: R$ ${formatarMoeda(item.custoTotalProducao)} | Lucro: R$ ${formatarMoeda(item.lucro)} | Margem: ${item.margemLucro.toFixed(1)}%
      `;
    } else {
      conteudo = `
        ${emoji} <strong>${item.nome}</strong> (${item.data})<br>
        Custo: R$ ${formatarMoeda(item.custoTotalPeca)} |
        Venda Direta: R$ ${formatarMoeda(item.precos[0].preco)} |
        ML: R$ ${formatarMoeda(item.precos[1].preco)} |
        Shopee: R$ ${formatarMoeda(item.precos[2].preco)}
      `;
    }
    return `
      <div class="historico-item ${classeExtra}">
        <div class="historico-info">${conteudo}</div>
        <div class="historico-acoes">
          <button onclick="excluirDoHistorico(${idx})" class="btn-perigo">❌</button>
        </div>
      </div>
    `;
  }).join('');
}

window.excluirDoHistorico = function(index) {
  if (confirm('Excluir este registro?')) {
    const historico = carregarHistorico();
    historico.splice(index, 1);
    localStorage.setItem('calc3d_historico', JSON.stringify(historico));
    renderizarHistorico();
  }
};

// Ajustar taxas automaticamente no reverso ao mudar canal
document.getElementById('revCanal').addEventListener('change', function() {
  const canal = this.value;
  if (canal === 'direta') {
    document.getElementById('revTaxaPercent').value = 0;
    document.getElementById('revTaxaFixa').value = 0;
    document.getElementById('revTaxaPercent').disabled = true;
    document.getElementById('revTaxaFixa').disabled = true;
  } else if (canal === 'ml') {
    document.getElementById('revTaxaPercent').value = 11.5;
    document.getElementById('revTaxaFixa').value = 5.00;
    document.getElementById('revTaxaPercent').disabled = false;
    document.getElementById('revTaxaFixa').disabled = false;
  } else if (canal === 'shopee') {
    document.getElementById('revTaxaPercent').value = 12;
    document.getElementById('revTaxaFixa').value = 4.00;
    document.getElementById('revTaxaPercent').disabled = false;
    document.getElementById('revTaxaFixa').disabled = false;
  }
});

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/3dcalculator/sw.js')
      .then(reg => console.log('SW registrado com escopo:', reg.scope))
      .catch(err => console.log('Erro no SW:', err));
  });
}