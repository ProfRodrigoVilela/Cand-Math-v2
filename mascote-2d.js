/* ===================================================
   CANDY MATH — mascote-2d.js
   O Juba Candy de corpo inteiro: carrega mascote-corpo.svg, monta o desenho
   onde houver lugar para ele, veste as peças que têm desenho e mexe a boca
   enquanto narracao.js estiver soando de verdade.

   Peça sem desenho aqui continua no ícone do catálogo: vestir() responde false
   e o script.js pinta o ícone. Se o SVG não carregar, tudo vira ícone.
   =================================================== */
(function (root) {
  'use strict';

  // Peça do catálogo → forma desenhada. Os vestidos dividem a mesma forma.
  const FORMA = {
    hat_crown: 'hat_crown',
    glass_heart: 'glass_heart',
    out_cape: 'out_cape',
    shoe_social_cacau: 'shoe_social_cacau',
    dress_mor: 'vestido',
    dress_uva: 'vestido',
    dress_lima: 'vestido',
    dress_azul: 'vestido',
    dress_mel: 'vestido',
  };
  const ENCAIXES = {
    hat: ['chapeu'],
    wig: ['peruca'],
    glasses: ['oculos'],
    outfit: ['roupa-fundo', 'roupa'],
    shoes: ['calcado'],
    accessory: ['acessorio'],
  };
  const LUGARES = ['oncaDisplay', 'wdOncaWrap', 'mascoteFalaCorpo'];

  const vestido = {};               // slot → peça em uso
  const corpos = [];                // cada <svg> montado na página
  let molde = null;
  let falhou = false;
  let falando = false;
  let faixaDaFala = null;           // faixa do jogo cujo balão está com a pergunta
  let relogioReacao = 0;

  function pintarSlot(svg, slot) {
    const item = vestido[slot];
    const forma = item ? FORMA[item.id] : null;
    (ENCAIXES[slot] || []).forEach(function (nome) {
      svg.querySelectorAll('[data-encaixe="' + nome + '"] [data-peca]').forEach(function (g) {
        const usar = g.getAttribute('data-peca') === forma;
        g.setAttribute('display', usar ? 'inline' : 'none');
        if (usar && item.iconColor) g.style.setProperty('--m2d-cor', item.iconColor);
      });
    });
  }

  function vestir(slot, item) {
    vestido[slot] = item || null;
    corpos.forEach(function (svg) { pintarSlot(svg, slot); });
    return !!(item && FORMA[item.id]) && !falhou;
  }

  // Nos jogos ele fica na faixa de feedback, no lugar do rostinho. Duelo e prova
  // ficam de fora: lá o rostinho só acompanha o resultado.
  function lugaresParaMontar() {
    const d = root.document;
    const fixos = LUGARES.map(function (id) { return d.getElementById(id); });
    const jogos = d.querySelectorAll('.screen:not(#screenDuelo):not(#screenProva) .qf-onca');
    jogos.forEach(function (onca) { onca.parentElement.classList.add('m2d-presente'); });
    return fixos.concat(Array.from(jogos));
  }

  function montar() {
    lugaresParaMontar().forEach(function (lugar) {
      if (!lugar) return;
      const svg = root.document.importNode(molde, true);
      svg.classList.toggle('m2d-falando', falando);
      Object.keys(ENCAIXES).forEach(function (slot) { pintarSlot(svg, slot); });
      lugar.prepend(svg);
      lugar.classList.add('m2d-pronto');
      corpos.push(svg);
    });
  }

  function carregar() {
    return root.fetch('mascote-corpo.svg')
      .then(function (r) {
        if (!r.ok) throw new Error('resposta ' + r.status);
        return r.text();
      })
      .then(function (texto) {
        const lido = new root.DOMParser().parseFromString(texto, 'image/svg+xml');
        if (lido.documentElement.nodeName !== 'svg') throw new Error('não é um SVG');
        molde = lido.documentElement;
        montar();
      })
      .catch(function (e) {
        // Sem o desenho o jogo segue com a patinha e os ícones de sempre.
        falhou = true;
        if (root.console && root.console.warn) root.console.warn('CM_MASCOTE: sem o SVG do corpo', e);
        if (typeof root.updateHubUI === 'function') root.updateHubUI();
      });
  }

  function reagir(tipo) {
    const classe = tipo === 'acerto' ? 'm2d-feliz' : 'm2d-triste';
    root.clearTimeout(relogioReacao);
    corpos.forEach(function (svg) {
      svg.classList.remove('m2d-feliz', 'm2d-triste');
      void svg.getBoundingClientRect();    // reinicia a animação em acertos seguidos
      svg.classList.add(classe);
    });
    relogioReacao = root.setTimeout(function () {
      corpos.forEach(function (svg) { svg.classList.remove('m2d-feliz', 'm2d-triste'); });
    }, 1500);
  }

  // emFala só é verdade entre o início e o fim reais do áudio ou da Web Speech.
  function aoMudarVoz(s) {
    falando = !!s.emFala;
    corpos.forEach(function (svg) { svg.classList.toggle('m2d-falando', falando); });
    const palco = root.document.getElementById('mascoteFala');
    const balao = root.document.getElementById('mascoteFalaTexto');
    if (!palco || !balao) return;
    const mostrar = falando && !!s.texto && !falhou;
    // Com a tela de Voz aberta, a faixa do jogo fica atrás dela: a amostra usa o palco.
    const overlay = root.document.getElementById('modalOverlay');
    const modalAberto = !!(overlay && overlay.classList.contains('open'));
    const faixa = mostrar && !modalAberto ? root.document.querySelector('.screen.active .m2d-presente') : null;
    if (faixaDaFala && faixaDaFala !== faixa) faixaDaFala.classList.remove('show');
    faixaDaFala = faixa;
    if (faixa) {
      // O mascote já está na tela: fala pelo balão dele, sem abrir um segundo.
      faixa.querySelector('.qf-bubble').textContent = s.texto;
      faixa.classList.add('show');
      palco.hidden = true;
      return;
    }
    if (mostrar) balao.textContent = s.texto;
    palco.hidden = !mostrar;
  }

  root.CM_MASCOTE = { vestir: vestir, reagir: reagir };

  if (root.document && root.fetch) {
    carregar();
    if (root.CM_NARRACAO) root.CM_NARRACAO.aoMudar(aoMudarVoz);
  } else {
    falhou = true;
  }
})(window);
