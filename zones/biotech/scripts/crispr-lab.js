/* ============================================================
   BioVerse — CRISPR Gene Editor Simulation
   PAM site finding, DNA cutting, gene insertion, phenotype
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const Engine = window.BioVerseEngine;

  // Gene databases
  const GENES = {
    sickle_cell: {
      name: 'HBB (β-globin)',
      sequence: 'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTG',
      disease: 'Bệnh hồng cầu hình liềm',
      mutation: 'GAG → GTG (Glu → Val)',
      phenoBefore: '🔴',
      phenoAfter: '🟢',
      phenoBeforeLabel: 'Hồng cầu hình liềm',
      phenoAfterLabel: 'Hồng cầu bình thường'
    },
    cystic_fibrosis: {
      name: 'CFTR',
      sequence: 'ATGCAGAGGTCGCCTCTGGAAAAGGCCAGCGTTGTCTCCAAACTTTTTTTCAGCTGG',
      disease: 'Xơ nang',
      mutation: 'Mất 3bp (ΔF508)',
      phenoBefore: '🫁',
      phenoAfter: '💚',
      phenoBeforeLabel: 'Phổi tích chất nhầy',
      phenoAfterLabel: 'Phổi bình thường'
    },
    huntington: {
      name: 'HTT (Huntingtin)',
      sequence: 'ATGGCGACCCTGGAAAAGCTGATGAAGGCCTTCGAGTCCCTCAAGTCCTTCCAGCAG',
      disease: 'Huntington',
      mutation: 'CAG repeat mở rộng',
      phenoBefore: '🧠',
      phenoAfter: '💚',
      phenoBeforeLabel: 'Thoái hóa thần kinh',
      phenoAfterLabel: 'Chức năng bình thường'
    }
  };

  let currentGene = null;
  let selectedPAM = null;
  let isCut = false;
  let cutPosition = -1;

  const geneSelect = document.getElementById('geneSelect');
  const customDNA = document.getElementById('customDNA');
  const customSeqInput = document.getElementById('customSeqInput');
  const dnaStrand = document.getElementById('dnaStrand');
  const guideRNADisplay = document.getElementById('guideRNADisplay');
  const guideRNAInfo = document.getElementById('guideRNAInfo');
  const editResult = document.getElementById('editResult');
  const btnCut = document.getElementById('btnCut');
  const btnInsert = document.getElementById('btnInsert');
  const btnReset = document.getElementById('btnReset');
  const phenoBefore = document.getElementById('phenoBefore');
  const phenoAfter = document.getElementById('phenoAfter');

  // ── Init ──
  loadGene(geneSelect.value);

  geneSelect.addEventListener('change', () => {
    if (geneSelect.value === 'custom') {
      customDNA.style.display = 'block';
    } else {
      customDNA.style.display = 'none';
      loadGene(geneSelect.value);
    }
  });

  customSeqInput.addEventListener('input', () => {
    const seq = customSeqInput.value.toUpperCase().replace(/[^ATCG]/g, '');
    if (seq.length >= 10) {
      currentGene = {
        name: 'Custom Gene',
        sequence: seq,
        disease: 'Custom',
        phenoBefore: '❓',
        phenoAfter: '✅',
        phenoBeforeLabel: 'Đột biến',
        phenoAfterLabel: 'Đã sửa'
      };
      renderDNA(seq);
    }
  });

  function loadGene(geneId) {
    currentGene = GENES[geneId];
    selectedPAM = null;
    isCut = false;
    cutPosition = -1;
    renderDNA(currentGene.sequence);
    updatePhenotype();
    editResult.innerHTML = `
      <div style="color: var(--color-text-muted);">
        <strong style="color: var(--color-primary);">${currentGene.name}</strong> — ${currentGene.disease}<br>
        <span style="font-size: var(--fs-xs);">Đột biến: ${currentGene.mutation || 'N/A'}</span>
      </div>
    `;
    btnCut.disabled = true;
    btnInsert.disabled = true;
    guideRNADisplay.style.display = 'none';
    updateSteps(1);
  }

  // ── Render DNA Strand ──
  function renderDNA(sequence) {
    if (!Engine) return;
    const pamSites = Engine.Biology.crispr.findPAM(sequence);
    const pamPositions = new Set();
    pamSites.forEach(s => {
      for (let i = s.position; i < s.position + 3 && i < sequence.length; i++) {
        pamPositions.add(i);
      }
    });

    dnaStrand.innerHTML = '';
    for (let i = 0; i < sequence.length; i++) {
      const base = document.createElement('span');
      base.className = `dna-base ${sequence[i]}`;
      base.textContent = sequence[i];
      base.dataset.index = i;

      if (pamPositions.has(i)) {
        base.classList.add('dna-pam');
        base.style.cursor = 'pointer';
        base.title = 'PAM site — Click để chọn';
        base.addEventListener('click', () => selectPAM(i, sequence, pamSites));
      }

      if (isCut && i === cutPosition) {
        base.classList.add('cut');
      }

      dnaStrand.appendChild(base);
    }
  }

  // ── Select PAM Site ──
  function selectPAM(index, sequence, pamSites) {
    if (isCut) return;

    // Find the PAM site containing this index
    const pam = pamSites.find(s => index >= s.position && index < s.position + 3);
    if (!pam) return;

    selectedPAM = pam;
    cutPosition = pam.position;

    // Highlight selected bases
    document.querySelectorAll('.dna-base.selected').forEach(b => b.classList.remove('selected'));
    for (let i = pam.position; i < pam.position + 3; i++) {
      const base = dnaStrand.children[i];
      if (base) base.classList.add('selected');
    }

    // Show guide RNA
    const guideRNA = sequence.substring(Math.max(0, pam.position - 20), pam.position)
      .replace(/T/g, 'U'); // DNA→RNA
    guideRNADisplay.textContent = `5'-${guideRNA}-3' (Guide RNA)`;
    guideRNADisplay.style.display = 'block';
    guideRNAInfo.textContent = `PAM site tại vị trí ${pam.position}: ${pam.sequence}`;

    btnCut.disabled = false;
    updateSteps(2);

    // Track
    if (window.BioVerseData) {
      BioVerseData.Analytics.track({ type: 'crispr_pam_select', position: pam.position });
    }
  }

  // ── Cut DNA ──
  btnCut.addEventListener('click', () => {
    if (!selectedPAM || isCut) return;

    isCut = true;
    const result = Engine.Biology.crispr.cutDNA(currentGene.sequence, cutPosition);

    // Animate cut
    const bases = dnaStrand.querySelectorAll('.dna-base');
    bases[cutPosition].classList.add('cut');

    // Visual split
    setTimeout(() => {
      editResult.innerHTML = `
        <div style="margin-bottom: var(--space-sm);">
          <strong style="color: var(--color-success);">✅ DNA đã được cắt tại vị trí ${cutPosition}!</strong>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span style="padding: 6px 12px; background: rgba(0,212,170,0.1); border-radius: 6px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-primary);">
            5'-${result.before}-
          </span>
          <span style="color: var(--color-error); font-size: 1.5rem;">✂️</span>
          <span style="padding: 6px 12px; background: rgba(124,77,255,0.1); border-radius: 6px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-accent);">
            -${result.after}-3'
          </span>
        </div>
        <p style="font-size: var(--fs-xs); color: var(--color-text-dim); margin-top: 8px;">
          Cas9 đã tạo đứt gãy sợi đôi (DSB). Nhập trình tự mới để chèn vào.
        </p>
      `;
      btnCut.disabled = true;
      btnInsert.disabled = false;
      updateSteps(3);
    }, 500);

    // XP
    if (window.BioVerseData) {
      BioVerseData.Profile.addXP(15, 'Cắt DNA bằng CRISPR');
      BioVerseData.Analytics.track({ type: 'crispr_cut', gene: currentGene.name });
    }
  });

  // ── Insert Gene ──
  btnInsert.addEventListener('click', () => {
    const insertion = document.getElementById('insertSeq').value.toUpperCase().replace(/[^ATCG]/g, '');
    if (!insertion) {
      editResult.innerHTML += `<p style="color: var(--color-warning); font-size: var(--fs-xs); margin-top: 8px;">⚠️ Vui lòng nhập trình tự DNA cần chèn!</p>`;
      return;
    }

    const before = currentGene.sequence.substring(0, cutPosition);
    const after = currentGene.sequence.substring(cutPosition);
    const newSequence = before + insertion + after;

    // Update display
    currentGene.sequence = newSequence;
    isCut = false;
    renderDNA(newSequence);

    // Highlight inserted bases
    setTimeout(() => {
      for (let i = cutPosition; i < cutPosition + insertion.length; i++) {
        if (dnaStrand.children[i]) {
          dnaStrand.children[i].classList.add('inserted');
        }
      }
    }, 100);

    editResult.innerHTML = `
      <div style="margin-bottom: var(--space-sm);">
        <strong style="color: var(--color-success);">✅ Gene đã được chèn thành công!</strong>
      </div>
      <div style="font-size: var(--fs-xs); color: var(--color-text-muted); line-height: 1.6;">
        <strong>Trình tự mới:</strong> ${newSequence.length} bp<br>
        <strong>Chèn:</strong> ${insertion} (${insertion.length} bp) tại vị trí ${cutPosition}<br>
        <strong>Phương pháp sửa chữa:</strong> HDR (Homology-Directed Repair)
      </div>
    `;

    // Update phenotype
    phenoAfter.textContent = currentGene.phenoAfter;
    const afterLabel = document.querySelector('#phenotypeResult > div:last-child > div:last-child');
    if (afterLabel) afterLabel.textContent = currentGene.phenoAfterLabel || 'Đã sửa';

    btnInsert.disabled = true;
    updateSteps(4);

    // XP + Badge
    if (window.BioVerseData) {
      BioVerseData.Profile.addXP(25, 'Chèn gene mới');
      BioVerseData.Profile.updateZoneProgress('biotech', 'crispr', 100);
      BioVerseData.Profile.updateCompetency('biologicalKnowledge', 70);
      BioVerseData.Profile.updateCompetency('experimentalSkills', 60);
      BioVerseData.Badges.check();
      BioVerseData.Analytics.track({
        type: 'crispr_insert',
        gene: currentGene.name,
        insertion,
        position: cutPosition
      });
    }
  });

  // ── Reset ──
  btnReset.addEventListener('click', () => {
    if (geneSelect.value !== 'custom') {
      currentGene = { ...GENES[geneSelect.value] };
      loadGene(geneSelect.value);
    }
    document.getElementById('insertSeq').value = '';
    document.getElementById('crisprHypothesis').value = '';
  });

  // ── Step Indicator ──
  function updateSteps(step) {
    document.querySelectorAll('.step-dot').forEach(dot => {
      const s = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'completed');
      if (s < step) dot.classList.add('completed');
      if (s === step) dot.classList.add('active');
    });
    document.querySelectorAll('.step-line').forEach((line, i) => {
      line.classList.toggle('completed', i + 1 < step);
    });
  }

  // ── Phenotype Display ──
  function updatePhenotype() {
    if (currentGene) {
      phenoBefore.textContent = currentGene.phenoBefore;
      phenoAfter.textContent = '❓';
    }
  }

  // Track visit
  if (window.BioVerseData) {
    BioVerseData.Analytics.track({ type: 'module_visit', module: 'crispr' });
    BioVerseData.Profile.updateZoneProgress('biotech', 'crispr', 10);
  }
});
