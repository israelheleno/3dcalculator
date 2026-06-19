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

// ---------- FEEDBACK UNIFICADO ----------
function mostrarFeedback(elemento, duracao = 2500) {
  elemento.classList.remove('oculto');
  elemento.style.opacity = '1';
  elemento.style.transform = 'translateY(0)';
  setTimeout(() => {
    elemento.style.opacity = '0';
    elemento.style.transform = 'translateY(-8px)';
    setTimeout(() => elemento.classList.add('oculto'), 300);
  }, duracao);
}

function desabilitarBotao(botao, duracao = 2000) {
  botao.disabled = true;
  botao.style.opacity = '0.6';
  botao.style.cursor = 'not-allowed';
  const textoOriginal = botao.textContent;
  botao.textContent = '⏳ Salvando...';
  setTimeout(() => {
    botao.disabled = false;
    botao.style.opacity = '1';
    botao.style.cursor = 'pointer';
    botao.textContent = textoOriginal;
  }, duracao);
}

// ---------- TOOLTIPS ----------
document.querySelectorAll('.tooltip').forEach(tooltip => {
  tooltip.addEventListener('click', function(e) {
    e.stopPropagation();
    // Fecha outros tooltips abertos
    document.querySelectorAll('.tooltip-ativo').forEach(t => {
      if (t !== this) t.classList.remove('tooltip-ativo');
    });
    this.classList.toggle('tooltip-ativo');
  });
});

// Fecha tooltip ao clicar fora
document.addEventListener('click', () => {
  document.querySelectorAll('.tooltip-ativo').forEach(t => {
    t.classList.remove('tooltip-ativo');
  });
});

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

// ---------- ARMAZENAMENTO ----------
function salvarHistorico(registro) {
  const historico = JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
  historico.push(registro);
  localStorage.setItem('calc3d_historico', JSON.stringify(historico));
}

function carregarHistorico() {
  return JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
}

function atualizarHistorico(historico) {
  localStorage.setItem('calc3d_historico', JSON.stringify(historico));
}

function limparHistorico() {
  localStorage.removeItem('calc3d_historico');
}

// ==========================================
// ABA CALCULADORA
// ==========================================
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

document.getElementById('calcularBtn').addEventListener('click', function() {
  this.textContent = '⏳ Calculando...';
  this.style.opacity = '0.7';
  
  setTimeout(() => {
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
    let custoEnergiaEscolhido = 0;
    let consumoIndividual = 0;
    let consumoLotePorPeca = 0;
    let qtdLote = 1;

    if (modo === 'individual') {
      const tempoHoras = strParaHoras(tempoIndividualH.value, tempoIndividualM.value);
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

    document.getElementById('precosCanais').innerHTML = precos.map(p => {
      if (p.erro) return `<p>${p.nome}: taxa inválida</p>`;
      return `<p><strong>${p.nome}:</strong> R$ ${formatarMoeda(p.preco)}</p>`;
    }).join('');

    document.getElementById('resultados').classList.remove('oculto');
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });

    window._ultimoCalculo = {
      tipo: 'calculo',
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

    this.textContent = '📊 Calcular';
    this.style.opacity = '1';
  }, 300);
});

document.getElementById('salvarHistoricoBtn').addEventListener('click', function() {
  if (window._ultimoCalculo && window._ultimoCalculo.tipo === 'calculo') {
    desabilitarBotao(this);
    salvarHistorico(window._ultimoCalculo);
    mostrarFeedback(document.getElementById('feedbackMsg'));
    if (document.getElementById('history-tab').classList.contains('active')) {
      setTimeout(renderizarHistorico, 500);
    }
  } else {
    alert('Nenhum cálculo realizado. Clique em "Calcular" primeiro.');
  }
});

// ==========================================
// ABA REVERSO
// ==========================================
document.getElementById('calcularReversoBtn').addEventListener('click', function() {
  this.textContent = '⏳ Analisando...';
  this.style.opacity = '0.7';
  
  setTimeout(() => {
    const custoFilamento = parseFloatSafe(document.getElementById('revCustoFilamento').value);
    const custoEnergia = parseFloatSafe(document.getElementById('revCustoEnergia').value);
    const tempoProducao = parseFloatSafe(document.getElementById('revTempoProducao').value);
    const precoVenda = parseFloatSafe(document.getElementById('revPrecoVenda').value);
    const canal = document.getElementById('revCanal').value;

    const custoTotal = custoFilamento + custoEnergia;

    let taxaPercent = 0;
    let taxaFixa = 0;
    let nomeCanal = '';

    if (canal === 'ml') {
      taxaPercent = 0.115;
      taxaFixa = 6.00;
      nomeCanal = 'Mercado Livre';
    } else if (canal === 'shopee') {
      taxaPercent = 0.12;
      taxaFixa = 4.00;
      nomeCanal = 'Shopee';
    } else {
      taxaPercent = 0;
      taxaFixa = 0;
      nomeCanal = 'Venda Direta';
    }

    const taxaPercentual = precoVenda * taxaPercent;
    const taxasTotais = taxaPercentual + taxaFixa;
    const valorLiquido = precoVenda - taxasTotais;
    const lucro = valorLiquido - custoTotal;
    const margemLucro = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

    document.getElementById('revFilamento').textContent = formatarMoeda(custoFilamento);
    document.getElementById('revEnergia').textContent = formatarMoeda(custoEnergia);
    document.getElementById('revCustoTotal').textContent = formatarMoeda(custoTotal);
    document.getElementById('revPreco').textContent = formatarMoeda(precoVenda);
    document.getElementById('revTaxas').textContent = formatarMoeda(taxasTotais);
    document.getElementById('revLiquido').textContent = formatarMoeda(valorLiquido);

    document.getElementById('revLucro').innerHTML = `<strong>Lucro:</strong> R$ ${formatarMoeda(lucro)}`;
    document.getElementById('revMargem').innerHTML = `<strong>Margem:</strong> ${formatarMoeda(margemLucro)}%`;

    const vereditoEl = document.getElementById('revVeredito');
    if (lucro > 5) {
      vereditoEl.textContent = '✅ VALE A PENA fabricar!';
      vereditoEl.className = 'veredito-texto veredito-positivo';
      document.getElementById('revVereditoContainer').style.borderColor = 'rgba(74, 222, 128, 0.5)';
    } else if (lucro >= 0 && lucro <= 5) {
      vereditoEl.textContent = '⚠️ Lucro muito baixo. Pode não valer o esforço.';
      vereditoEl.className = 'veredito-texto veredito-alerta';
      document.getElementById('revVereditoContainer').style.borderColor = 'rgba(251, 191, 36, 0.5)';
    } else {
      vereditoEl.textContent = '❌ NÃO VALE A PENA fabricar!';
      vereditoEl.className = 'veredito-texto veredito-negativo';
      document.getElementById('revVereditoContainer').style.borderColor = 'rgba(248, 113, 113, 0.5)';
    }

    document.getElementById('resultadosReverso').classList.remove('oculto');
    document.getElementById('resultadosReverso').scrollIntoView({ behavior: 'smooth' });

    window._ultimoCalculoReverso = {
      tipo: 'reverso',
      data: new Date().toLocaleString(),
      custoFilamento,
      custoEnergia,
      tempoProducao,
      precoVenda,
      canal,
      nomeCanal,
      custoTotal,
      taxasTotais,
      valorLiquido,
      lucro,
      margemLucro,
      taxaPercent,
      taxaFixa
    };

    this.textContent = '🔄 Calcular Viabilidade';
    this.style.opacity = '1';
  }, 300);
});

document.getElementById('salvarReversoBtn').addEventListener('click', function() {
  if (window._ultimoCalculoReverso && window._ultimoCalculoReverso.tipo === 'reverso') {
    desabilitarBotao(this);
    salvarHistorico(window._ultimoCalculoReverso);
    mostrarFeedback(document.getElementById('feedbackReversoMsg'));
    if (document.getElementById('history-tab').classList.contains('active')) {
      setTimeout(renderizarHistorico, 500);
    }
  } else {
    alert('Nenhuma análise reversa realizada. Clique em "Calcular Viabilidade" primeiro.');
  }
});

// ==========================================
// ABA HISTÓRICO
// ==========================================
document.getElementById('limparHistoricoBtn').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.')) {
    limparHistorico();
    renderizarHistorico();
  }
});

// Exportar CSV
document.getElementById('exportarCsvBtn').addEventListener('click', () => {
  const historico = carregarHistorico();
  if (historico.length === 0) {
    alert('Nenhum dado no histórico para exportar.');
    return;
  }

  let csv = 'Tipo,Nome,Data,Custo Total,Preço Venda Direta,Preço ML,Preço Shopee,Lucro,Margem\n';
  
  historico.forEach(item => {
    if (item.tipo === 'calculo') {
      csv += `Cálculo,"${item.nome}","${item.data}",${item.custoTotalPeca},${item.precos[0].preco},${item.precos[1].preco},${item.precos[2].preco},,\n`;
    } else if (item.tipo === 'reverso') {
      csv += `Reverso,"Análise de Viabilidade","${item.data}",${item.custoTotal},,,,${item.lucro},${item.margemLucro}\n`;
    }
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '3d-calculator-pro-historico.csv';
  link.click();
  URL.revokeObjectURL(url);
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
    if (item.tipo === 'reverso') {
      return `
        <div class="historico-item">
          <div class="historico-info">
            <span class="badge-tipo reverso-badge">🔄 Reverso</span>
            <strong>Análise de Viabilidade</strong> (${item.data})<br>
            Canal: ${item.nomeCanal} | Preço: R$ ${formatarMoeda(item.precoVenda)}<br>
            Custo: R$ ${formatarMoeda(item.custoTotal)} | Lucro: R$ ${formatarMoeda(item.lucro)}
          </div>
          <div class="historico-acoes">
            <button class="btn-perigo" onclick="excluirDoHistorico(${idx})">❌</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="historico-item">
        <div class="historico-info">
          <span class="badge-tipo calculo-badge">🧮 Cálculo</span>
          <strong class="nome-historico" data-index="${idx}">${item.nome}</strong>
          <button class="btn-editar-nome" onclick="editarNomeHistorico(${idx}, this)" title="Editar nome">✏️</button>
          (${item.data})<br>
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

// Editar nome no histórico
window.editarNomeHistorico = function(index, botao) {
  const historico = carregarHistorico();
  const item = historico[index];
  if (!item || item.tipo !== 'calculo') return;

  const nomeEl = botao.parentElement.querySelector('.nome-historico');
  const nomeAtual = item.nome;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = nomeAtual;
  input.className = 'input-editar-nome';
  input.style.cssText = 'width: 150px; padding: 4px 8px; margin-right: 4px; font-size: 0.9rem;';

  nomeEl.replaceWith(input);
  input.focus();
  input.select();

  const salvarEdicao = () => {
    const novoNome = input.value.trim() || 'Sem nome';
    item.nome = novoNome;
    atualizarHistorico(historico);
    renderizarHistorico();
  };

  input.addEventListener('blur', salvarEdicao);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur();
    }
    if (e.key === 'Escape') {
      input.value = nomeAtual;
      input.blur();
    }
  });
};

window.carregarDeHistorico = function(index) {
  const historico = carregarHistorico();
  const item = historico[index];
  if (!item || item.tipo !== 'calculo') return;

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
  document.getElementById('reverso-tab').classList.remove('active');
  document.getElementById('history-tab').classList.remove('active');

  document.getElementById('calcularBtn').click();
};

window.excluirDoHistorico = function(index) {
  if (confirm('Excluir este registro do histórico?')) {
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