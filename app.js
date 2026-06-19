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
  if (isNaN(valor) || valor === Infinity) return '0,00';
  return valor.toFixed(2).replace('.', ',');
}

function parseFloatSafe(val) {
  const v = parseFloat(val);
  return isNaN(v) ? 0 : v;
}

// ---------- FEEDBACK UNIFICADO ----------
function mostrarFeedback(elemento, duracao = 2500) {
  if (!elemento) return;
  elemento.classList.remove('oculto');
  elemento.style.opacity = '1';
  elemento.style.transform = 'translateY(0)';
  setTimeout(() => {
    elemento.style.opacity = '0';
    elemento.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (elemento) elemento.classList.add('oculto');
    }, 300);
  }, duracao);
}

function desabilitarBotao(botao, duracao = 2000) {
  if (!botao) return;
  botao.disabled = true;
  botao.style.opacity = '0.6';
  botao.style.cursor = 'not-allowed';
  const textoOriginal = botao.textContent;
  botao.textContent = '⏳ Salvando...';
  setTimeout(() => {
    if (!botao) return;
    botao.disabled = false;
    botao.style.opacity = '1';
    botao.style.cursor = 'pointer';
    botao.textContent = textoOriginal;
  }, duracao);
}

// ---------- TOOLTIPS ----------
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tooltip').forEach(tooltip => {
    tooltip.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.tooltip-ativo').forEach(t => {
        if (t !== this) t.classList.remove('tooltip-ativo');
      });
      this.classList.toggle('tooltip-ativo');
    });
  });

  document.addEventListener('click', function() {
    document.querySelectorAll('.tooltip-ativo').forEach(t => {
      t.classList.remove('tooltip-ativo');
    });
  });

  // ---------- INTERFACE DE ABAS ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tab = this.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
      });
      if (tab === 'history') {
        renderizarHistorico();
      }
    });
  });

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
    const modo = modoSelect ? modoSelect.value : 'individual';
    if (modo === 'individual') {
      if (containerIndividual) containerIndividual.style.display = 'block';
      if (containerLote) containerLote.style.display = 'none';
    } else {
      if (containerIndividual) containerIndividual.style.display = 'none';
      if (containerLote) containerLote.style.display = 'block';
      calcularTempoMedioLote();
    }
  }

  function calcularTempoMedioLote() {
    const qtd = parseInt(document.getElementById('qtdLote')?.value) || 1;
    const tempoTotal = strParaHoras(
      tempoLoteTotalH ? tempoLoteTotalH.value : '0',
      tempoLoteTotalM ? tempoLoteTotalM.value : '0'
    );
    const tempoMedio = qtd > 0 ? tempoTotal / qtd : 0;
    if (tempoMedioLoteSpan) {
      tempoMedioLoteSpan.textContent = horasParaStr(tempoMedio);
    }
  }

  if (modoSelect) modoSelect.addEventListener('change', atualizarCamposTempo);
  const qtdLoteEl = document.getElementById('qtdLote');
  if (qtdLoteEl) qtdLoteEl.addEventListener('input', calcularTempoMedioLote);
  if (tempoLoteTotalH) tempoLoteTotalH.addEventListener('input', calcularTempoMedioLote);
  if (tempoLoteTotalM) tempoLoteTotalM.addEventListener('input', calcularTempoMedioLote);
  atualizarCamposTempo();

  const calcularBtn = document.getElementById('calcularBtn');
  if (calcularBtn) {
    calcularBtn.addEventListener('click', function() {
      this.textContent = '⏳ Calculando...';
      this.style.opacity = '0.7';
      
      setTimeout(() => {
        const peso = parseFloatSafe(document.getElementById('peso')?.value);
        const desperdicio = parseFloatSafe(document.getElementById('desperdicio')?.value) / 100;
        const precoFilamento = parseFloatSafe(document.getElementById('precoFilamento')?.value);
        const pesoFinal = peso * (1 + desperdicio);
        const custoFilamento = (pesoFinal / 1000) * precoFilamento;

        const precoKwh = parseFloatSafe(document.getElementById('precoKwh')?.value);
        const pico = parseFloatSafe(document.getElementById('potenciaPico')?.value);
        const duracaoPico = parseFloatSafe(document.getElementById('duracaoPico')?.value);
        const sustentada = parseFloatSafe(document.getElementById('potenciaSustentada')?.value);

        const modo = modoSelect ? modoSelect.value : 'individual';
        let custoEnergiaEscolhido = 0;
        let consumoIndividual = 0;
        let consumoLotePorPeca = 0;
        let qtdLote = 1;

        if (modo === 'individual') {
          const tempoHoras = strParaHoras(
            tempoIndividualH ? tempoIndividualH.value : '0',
            tempoIndividualM ? tempoIndividualM.value : '0'
          );
          consumoIndividual = calcularEnergia(tempoHoras, pico, duracaoPico, sustentada);
          custoEnergiaEscolhido = consumoIndividual * precoKwh;
        } else {
          qtdLote = parseInt(document.getElementById('qtdLote')?.value) || 1;
          const tempoLoteTotal = strParaHoras(
            tempoLoteTotalH ? tempoLoteTotalH.value : '0',
            tempoLoteTotalM ? tempoLoteTotalM.value : '0'
          );
          const consumoLoteTotal = calcularEnergia(tempoLoteTotal, pico, duracaoPico, sustentada);
          consumoLotePorPeca = consumoLoteTotal / qtdLote;
          custoEnergiaEscolhido = consumoLotePorPeca * precoKwh;

          const tempoInd = strParaHoras(
            tempoIndividualH ? tempoIndividualH.value : '0',
            tempoIndividualM ? tempoIndividualM.value : '0'
          );
          if (tempoInd > 0) {
            consumoIndividual = calcularEnergia(tempoInd, pico, duracaoPico, sustentada);
          }
        }

        const custoTotalPeca = custoFilamento + custoEnergiaEscolhido;

        const custoFilamentoEl = document.getElementById('custoFilamento');
        const custoEnergiaEl = document.getElementById('custoEnergia');
        const custoTotalPecaEl = document.getElementById('custoTotalPeca');
        if (custoFilamentoEl) custoFilamentoEl.textContent = formatarMoeda(custoFilamento);
        if (custoEnergiaEl) custoEnergiaEl.textContent = formatarMoeda(custoEnergiaEscolhido);
        if (custoTotalPecaEl) custoTotalPecaEl.textContent = formatarMoeda(custoTotalPeca);

        const consumoIndividualEl = document.getElementById('consumoIndividual');
        const consumoLoteEl = document.getElementById('consumoLote');
        if (consumoIndividualEl) consumoIndividualEl.textContent = consumoIndividual ? consumoIndividual.toFixed(3) : '-';
        if (consumoLoteEl) consumoLoteEl.textContent = consumoLotePorPeca ? consumoLotePorPeca.toFixed(3) : (modo === 'individual' ? '-' : '0.000');

        const economiaEl = document.getElementById('economiaLote');
        if (economiaEl) {
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
        }

        const margem = parseFloatSafe(document.getElementById('margemLucro')?.value) / 100;
        const canais = [
          {
            nome: 'Venda Direta',
            taxaPercent: parseFloatSafe(document.getElementById('taxaDireta')?.value) / 100,
            taxaFixa: parseFloatSafe(document.getElementById('fixoDireta')?.value)
          },
          {
            nome: 'Mercado Livre',
            taxaPercent: parseFloatSafe(document.getElementById('taxaML')?.value) / 100,
            taxaFixa: parseFloatSafe(document.getElementById('fixoML')?.value)
          },
          {
            nome: 'Shopee',
            taxaPercent: parseFloatSafe(document.getElementById('taxaShopee')?.value) / 100,
            taxaFixa: parseFloatSafe(document.getElementById('fixoShopee')?.value)
          }
        ];

        const precos = canais.map(canal => {
          const numerador = custoTotalPeca * (1 + margem) + canal.taxaFixa;
          const denominador = 1 - canal.taxaPercent;
          if (denominador <= 0) return { nome: canal.nome, preco: Infinity, erro: true };
          return { nome: canal.nome, preco: numerador / denominador };
        });

        const precosContainer = document.getElementById('precosCanais');
        if (precosContainer) {
          precosContainer.innerHTML = precos.map(p => {
            if (p.erro) return `<p>${p.nome}: taxa inválida</p>`;
            return `<p><strong>${p.nome}:</strong> R$ ${formatarMoeda(p.preco)}</p>`;
          }).join('');
        }

        const resultadosEl = document.getElementById('resultados');
        if (resultadosEl) {
          resultadosEl.classList.remove('oculto');
          resultadosEl.scrollIntoView({ behavior: 'smooth' });
        }

        window._ultimoCalculo = {
          tipo: 'calculo',
          nome: document.getElementById('nomeProduto')?.value || 'Sem nome',
          data: new Date().toLocaleString(),
          peso, desperdicio, precoFilamento,
          precoKwh, pico, duracaoPico, sustentada,
          modo,
          tempoIndividualH: tempoIndividualH ? tempoIndividualH.value : '0',
          tempoIndividualM: tempoIndividualM ? tempoIndividualM.value : '0',
          tempoLoteTotalH: modo === 'lote' && tempoLoteTotalH ? tempoLoteTotalH.value : '0',
          tempoLoteTotalM: modo === 'lote' && tempoLoteTotalM ? tempoLoteTotalM.value : '0',
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
  }

  const salvarHistoricoBtn = document.getElementById('salvarHistoricoBtn');
  if (salvarHistoricoBtn) {
    salvarHistoricoBtn.addEventListener('click', function() {
      if (window._ultimoCalculo && window._ultimoCalculo.tipo === 'calculo') {
        desabilitarBotao(this);
        salvarHistorico(window._ultimoCalculo);
        mostrarFeedback(document.getElementById('feedbackMsg'));
        if (document.getElementById('history-tab')?.classList.contains('active')) {
          setTimeout(renderizarHistorico, 500);
        }
      } else {
        alert('Nenhum cálculo realizado. Clique em "Calcular" primeiro.');
      }
    });
  }

  // ==========================================
  // ABA REVERSO
  // ==========================================
  const calcularReversoBtn = document.getElementById('calcularReversoBtn');
  if (calcularReversoBtn) {
    calcularReversoBtn.addEventListener('click', function() {
      this.textContent = '⏳ Analisando...';
      this.style.opacity = '0.7';
      
      setTimeout(() => {
        const custoFilamento = parseFloatSafe(document.getElementById('revCustoFilamento')?.value);
        const custoEnergia = parseFloatSafe(document.getElementById('revCustoEnergia')?.value);
        const tempoProducao = parseFloatSafe(document.getElementById('revTempoProducao')?.value);
        const precoVenda = parseFloatSafe(document.getElementById('revPrecoVenda')?.value);
        const canal = document.getElementById('revCanal')?.value || 'direta';

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

        const revFilamentoEl = document.getElementById('revFilamento');
        const revEnergiaEl = document.getElementById('revEnergia');
        const revCustoTotalEl = document.getElementById('revCustoTotal');
        const revPrecoEl = document.getElementById('revPreco');
        const revTaxasEl = document.getElementById('revTaxas');
        const revLiquidoEl = document.getElementById('revLiquido');
        const revLucroEl = document.getElementById('revLucro');
        const revMargemEl = document.getElementById('revMargem');
        const revVereditoEl = document.getElementById('revVeredito');
        const revVereditoContainer = document.getElementById('revVereditoContainer');

        if (revFilamentoEl) revFilamentoEl.textContent = formatarMoeda(custoFilamento);
        if (revEnergiaEl) revEnergiaEl.textContent = formatarMoeda(custoEnergia);
        if (revCustoTotalEl) revCustoTotalEl.textContent = formatarMoeda(custoTotal);
        if (revPrecoEl) revPrecoEl.textContent = formatarMoeda(precoVenda);
        if (revTaxasEl) revTaxasEl.textContent = formatarMoeda(taxasTotais);
        if (revLiquidoEl) revLiquidoEl.textContent = formatarMoeda(valorLiquido);
        if (revLucroEl) revLucroEl.innerHTML = `<strong>Lucro:</strong> R$ ${formatarMoeda(lucro)}`;
        if (revMargemEl) revMargemEl.innerHTML = `<strong>Margem:</strong> ${formatarMoeda(margemLucro)}%`;

        if (revVereditoEl) {
          if (lucro > 5) {
            revVereditoEl.textContent = '✅ VALE A PENA fabricar!';
            revVereditoEl.className = 'veredito-texto veredito-positivo';
            if (revVereditoContainer) revVereditoContainer.style.borderColor = 'rgba(74, 222, 128, 0.5)';
          } else if (lucro >= 0 && lucro <= 5) {
            revVereditoEl.textContent = '⚠️ Lucro muito baixo. Pode não valer o esforço.';
            revVereditoEl.className = 'veredito-texto veredito-alerta';
            if (revVereditoContainer) revVereditoContainer.style.borderColor = 'rgba(251, 191, 36, 0.5)';
          } else {
            revVereditoEl.textContent = '❌ NÃO VALE A PENA fabricar!';
            revVereditoEl.className = 'veredito-texto veredito-negativo';
            if (revVereditoContainer) revVereditoContainer.style.borderColor = 'rgba(248, 113, 113, 0.5)';
          }
        }

        const resultadosReversoEl = document.getElementById('resultadosReverso');
        if (resultadosReversoEl) {
          resultadosReversoEl.classList.remove('oculto');
          resultadosReversoEl.scrollIntoView({ behavior: 'smooth' });
        }

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
  }

  const salvarReversoBtn = document.getElementById('salvarReversoBtn');
  if (salvarReversoBtn) {
    salvarReversoBtn.addEventListener('click', function() {
      if (window._ultimoCalculoReverso && window._ultimoCalculoReverso.tipo === 'reverso') {
        desabilitarBotao(this);
        salvarHistorico(window._ultimoCalculoReverso);
        mostrarFeedback(document.getElementById('feedbackReversoMsg'));
        if (document.getElementById('history-tab')?.classList.contains('active')) {
          setTimeout(renderizarHistorico, 500);
        }
      } else {
        alert('Nenhuma análise reversa realizada. Clique em "Calcular Viabilidade" primeiro.');
      }
    });
  }

  // ==========================================
  // ABA HISTÓRICO
  // ==========================================
  const limparHistoricoBtn = document.getElementById('limparHistoricoBtn');
  if (limparHistoricoBtn) {
    limparHistoricoBtn.addEventListener('click', function() {
      if (confirm('Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.')) {
        limparHistorico();
        renderizarHistorico();
      }
    });
  }

  const exportarCsvBtn = document.getElementById('exportarCsvBtn');
  if (exportarCsvBtn) {
    exportarCsvBtn.addEventListener('click', function() {
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
  }
});

// ---------- ARMAZENAMENTO ----------
function salvarHistorico(registro) {
  try {
    const historico = JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
    historico.push(registro);
    localStorage.setItem('calc3d_historico', JSON.stringify(historico));
  } catch (e) {
    console.error('Erro ao salvar no histórico:', e);
  }
}

function carregarHistorico() {
  try {
    return JSON.parse(localStorage.getItem('calc3d_historico') || '[]');
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
    return [];
  }
}

function atualizarHistorico(historico) {
  try {
    localStorage.setItem('calc3d_historico', JSON.stringify(historico));
  } catch (e) {
    console.error('Erro ao atualizar histórico:', e);
  }
}

function limparHistorico() {
  try {
    localStorage.removeItem('calc3d_historico');
  } catch (e) {
    console.error('Erro ao limpar histórico:', e);
  }
}

function renderizarHistorico() {
  const historico = carregarHistorico();
  const container = document.getElementById('historicoLista');
  if (!container) return;
  
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
            <strong>Análise de Viabilidade</strong> (${item.data || 'Data indisponível'})<br>
            Canal: ${item.nomeCanal || 'N/A'} | Preço: R$ ${formatarMoeda(item.precoVenda)}<br>
            Custo: R$ ${formatarMoeda(item.custoTotal)} | Lucro: R$ ${formatarMoeda(item.lucro)}
          </div>
          <div class="historico-acoes">
            <button class="btn-perigo" onclick="window.excluirDoHistorico(${idx})">❌</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="historico-item">
        <div class="historico-info">
          <span class="badge-tipo calculo-badge">🧮 Cálculo</span>
          <strong class="nome-historico" data-index="${idx}">${item.nome || 'Sem nome'}</strong>
          <button class="btn-editar-nome" onclick="window.editarNomeHistorico(${idx}, this)" title="Editar nome">✏️</button>
          (${item.data || 'Data indisponível'})<br>
          Custo: R$ ${formatarMoeda(item.custoTotalPeca)} |
          Venda Direta: R$ ${formatarMoeda(item.precos && item.precos[0] ? item.precos[0].preco : 0)} |
          ML: R$ ${formatarMoeda(item.precos && item.precos[1] ? item.precos[1].preco : 0)} |
          Shopee: R$ ${formatarMoeda(item.precos && item.precos[2] ? item.precos[2].preco : 0)}
        </div>
        <div class="historico-acoes">
          <button onclick="window.carregarDeHistorico(${idx})">📂 Carregar</button>
          <button class="btn-perigo" onclick="window.excluirDoHistorico(${idx})">❌</button>
        </div>
      </div>
    `;
  }).join('');
}

// Funções globais
window.editarNomeHistorico = function(index, botao) {
  const historico = carregarHistorico();
  const item = historico[index];
  if (!item || item.tipo !== 'calculo') return;

  const parentInfo = botao.parentElement;
  const nomeEl = parentInfo.querySelector('.nome-historico');
  if (!nomeEl) return;
  
  const nomeAtual = item.nome || 'Sem nome';

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
    if (e.key === 'Enter') input.blur();
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

  const nomeProdutoEl = document.getElementById('nomeProduto');
  const pesoEl = document.getElementById('peso');
  const desperdicioEl = document.getElementById('desperdicio');
  const precoFilamentoEl = document.getElementById('precoFilamento');
  const precoKwhEl = document.getElementById('precoKwh');
  const potenciaPicoEl = document.getElementById('potenciaPico');
  const duracaoPicoEl = document.getElementById('duracaoPico');
  const potenciaSustentadaEl = document.getElementById('potenciaSustentada');
  const modoSelectEl = document.getElementById('modoProducao');
  const margemLucroEl = document.getElementById('margemLucro');
  const taxaMLEl = document.getElementById('taxaML');
  const fixoMLEl = document.getElementById('fixoML');
  const taxaShopeeEl = document.getElementById('taxaShopee');
  const fixoShopeeEl = document.getElementById('fixoShopee');

  if (nomeProdutoEl) nomeProdutoEl.value = item.nome || '';
  if (pesoEl) pesoEl.value = item.peso || 50;
  if (desperdicioEl) desperdicioEl.value = (item.desperdicio || 0.1) * 100;
  if (precoFilamentoEl) precoFilamentoEl.value = item.precoFilamento || 80;
  if (precoKwhEl) precoKwhEl.value = item.precoKwh || 0.93;
  if (potenciaPicoEl) potenciaPicoEl.value = item.pico || 1250;
  if (duracaoPicoEl) duracaoPicoEl.value = item.duracaoPico || 10;
  if (potenciaSustentadaEl) potenciaSustentadaEl.value = item.sustentada || 200;

  if (modoSelectEl) modoSelectEl.value = item.modo || 'individual';
  
  const tempoIndividualHEl = document.getElementById('tempoIndividualH');
  const tempoIndividualMEl = document.getElementById('tempoIndividualM');
  if (tempoIndividualHEl) tempoIndividualHEl.value = item.tempoIndividualH || '';
  if (tempoIndividualMEl) tempoIndividualMEl.value = item.tempoIndividualM || '';
  
  if (item.modo === 'lote') {
    const qtdLoteEl = document.getElementById('qtdLote');
    const tempoLoteTotalHEl = document.getElementById('tempoLoteTotalH');
    const tempoLoteTotalMEl = document.getElementById('tempoLoteTotalM');
    if (qtdLoteEl) qtdLoteEl.value = item.qtdLote || 2;
    if (tempoLoteTotalHEl) tempoLoteTotalHEl.value = item.tempoLoteTotalH || '';
    if (tempoLoteTotalMEl) tempoLoteTotalMEl.value = item.tempoLoteTotalM || '';
  }

  if (margemLucroEl) margemLucroEl.value = (item.margem || 0.5) * 100;
  if (item.canais) {
    if (taxaMLEl) taxaMLEl.value = item.canais[1]?.taxaPercent * 100 || 11.5;
    if (fixoMLEl) fixoMLEl.value = item.canais[1]?.taxaFixa || 6.00;
    if (taxaShopeeEl) taxaShopeeEl.value = item.canais[2]?.taxaPercent * 100 || 12;
    if (fixoShopeeEl) fixoShopeeEl.value = item.canais[2]?.taxaFixa || 4.00;
  }

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const calcTabBtn = document.querySelector('.tab-btn[data-tab="calc"]');
  if (calcTabBtn) calcTabBtn.classList.add('active');
  
  const calcTab = document.getElementById('calc-tab');
  const reversoTab = document.getElementById('reverso-tab');
  const historyTab = document.getElementById('history-tab');
  if (calcTab) calcTab.classList.add('active');
  if (reversoTab) reversoTab.classList.remove('active');
  if (historyTab) historyTab.classList.remove('active');

  const calcularBtn = document.getElementById('calcularBtn');
  if (calcularBtn) calcularBtn.click();
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