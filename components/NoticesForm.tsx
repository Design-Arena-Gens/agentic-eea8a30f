"use client";

import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ProjectInfo = {
  maitreOuvrage: string;
  architecte: string;
  operation: string;
  adresse: string;
  commune: string;
  codePostal: string;
  departement: string;
  date: string;
};

type EPRInfo = {
  typeEtab: string;
  categorie: string;
  neufOuExistant: "neuf" | "existant";
  surfaceUtile: string;
  niveaux: string;
  effectifPublic: string;
  effectifPersonnel: string;
  effectifResident: string;
  ssiCategorie: "A" | "B" | "C" | "D" | "E" | "Sans";
  alarmeType: "1" | "2a" | "2b" | "3" | "4" | "Sans";
  reactionF: string;
  resistanceF: string;
  desordreFumees: string;
  degagements: string;
  moyensSecours: string;
};

type AccessInfo = {
  cheminements: string;
  stationnement: string;
  escaliers: string;
  ascenseur: string;
  portes: string;
  sanitaires: string;
  signaletique: string;
  eclairage: string;
  derogations: string;
};

const defaultProject: ProjectInfo = {
  maitreOuvrage: "",
  architecte: "",
  operation: "Am?nagement / Construction d?un ERP",
  adresse: "",
  commune: "",
  codePostal: "",
  departement: "",
  date: new Date().toISOString().slice(0, 10)
};

const defaultERP: EPRInfo = {
  typeEtab: "M",
  categorie: "5",
  neufOuExistant: "neuf",
  surfaceUtile: "",
  niveaux: "R+0",
  effectifPublic: "",
  effectifPersonnel: "",
  effectifResident: "0",
  ssiCategorie: "Sans",
  alarmeType: "4",
  reactionF: "Rev?tements M2 ou Euroclasse C-s2,d0 selon locaux",
  resistanceF: "Structure R 15 ? R 60 selon port?es et niveaux",
  desordreFumees: "D?senfumage naturel des circulations si > 300 m?",
  degagements: "Largeur r?glementaire (0,90 m mini / unit?s de passage)",
  moyensSecours: "Extincteurs ? eau pulv?ris?e (6 l) et CO? selon risques"
};

const defaultAcc: AccessInfo = {
  cheminements: "Pente ? 5 % (jusqu?? 8 % ponctuellement avec palier), ressauts ? 2 cm chanfrein?s, largeur ? 1,20 m",
  stationnement: "1 place PMR/50, dimension 3,30 x 5 m, cheminement prot?g?",
  escaliers: "Nez contrast?s 3 cm, main courante bilat?rale, contremarche 10 cm 1?re/derni?re",
  ascenseur: "Obligatoire si ERP > R+0 ou si d?nivel? > 1 ?tage pour ERP 1-4",
  portes: "Largeur utile ? 0,90 m, effort d?ouverture adapt?, aires de man?uvre",
  sanitaires: "Cabine PMR: 1,50 m ?, barre d?appui, lave-mains accessible",
  signaletique: "Pictogrammes normalis?s, contraste visuel et tactile",
  eclairage: "Niveaux conformes, non ?blouissant, balisage des circulations",
  derogations: "Aucune d?rogation sollicit?e (? adapter si contraintes)"
};

function section(title: string, content: string) {
  return `\n\n${title}\n${"-".repeat(title.length)}\n${content}`.trim();
}

function computeEffectifTotal(erp: EPRInfo) {
  const p = Number(erp.effectifPublic || 0);
  const s = Number(erp.effectifPersonnel || 0);
  const r = Number(erp.effectifResident || 0);
  return p + s + r;
}

export default function NoticesForm() {
  const [project, setProject] = useState<ProjectInfo>(defaultProject);
  const [erp, setErp] = useState<EPRInfo>(defaultERP);
  const [access, setAccess] = useState<AccessInfo>(defaultAcc);
  const [customIncendie, setCustomIncendie] = useState<string>("");
  const [customAccess, setCustomAccess] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const noticeIncendie = useMemo(() => {
    const enTete =
      `Projet: ${project.operation}\n` +
      `Ma?tre d?ouvrage: ${project.maitreOuvrage}\n` +
      `Architecte: ${project.architecte}\n` +
      `Adresse: ${project.adresse}, ${project.codePostal} ${project.commune} (${project.departement})\n` +
      `Date: ${project.date}`;

    const classement =
      `Classement ERP: Type ${erp.typeEtab}, Cat?gorie ${erp.categorie}, ${erp.neufOuExistant === "neuf" ? "?tablissement neuf" : "?tablissement existant"}.\n` +
      `Niveaux: ${erp.niveaux} ? Surface utile: ${erp.surfaceUtile} m? ? Effectif total: ${computeEffectifTotal(erp)} (Public: ${erp.effectifPublic}, Personnel: ${erp.effectifPersonnel}, R?sidents: ${erp.effectifResident}).`;

    const reactionResistance =
      `R?action au feu: ${erp.reactionF}.\n` +
      `R?sistance au feu: ${erp.resistanceF}.`;

    const compartimentage =
      `Cloisonnement et d?gagements: ${erp.degagements}.`;

    const ssi =
      `Syst?me de S?curit? Incendie (SSI): Cat?gorie ${erp.ssiCategorie}, Alarme Type ${erp.alarmeType}.`;

    const fumees =
      `D?senfumage: ${erp.desordreFumees}.`;

    const moyens =
      `Moyens de secours: ${erp.moyensSecours}.`;

    const references =
      `R?f?rences r?glementaires: Code de la construction et de l?habitation, arr?t? du 25 juin 1980 (r?glement de s?curit? ERP) et arr?t?s sp?cifiques de type; ? v?rifier selon le classement retenu.`;

    const corps =
      section("En-t?te", enTete) +
      section("Classement et donn?es g?n?rales", classement) +
      section("R?action et r?sistance au feu", reactionResistance) +
      section("Compartimentage et ?vacuation", compartimentage) +
      section("SSI et alarme", ssi) +
      section("D?senfumage", fumees) +
      section("Moyens de secours", moyens) +
      section("R?f?rences", references);

    return (corps + (customIncendie ? section("Pr?cisions compl?mentaires", customIncendie) : "")).trim();
  }, [project, erp, customIncendie]);

  const noticeAccess = useMemo(() => {
    const infos =
      `Cheminements ext?rieurs et int?rieurs: ${access.cheminements}.\n` +
      `Stationnement adapt?: ${access.stationnement}.\n` +
      `Escaliers: ${access.escaliers}.\n` +
      `Ascenseur / ?l?vation: ${access.ascenseur}.\n` +
      `Portes et circulations: ${access.portes}.\n` +
      `Sanitaires accessibles: ${access.sanitaires}.\n` +
      `Signal?tique et guidage: ${access.signaletique}.\n` +
      `?clairage et confort d?usage: ${access.eclairage}.`;

    const refs =
      `R?f?rences: CCH (L.111-7 et R.*), arr?t? du 20/04/2017 et arr?t? du 8/12/2014 (ERP existants), normes applicables (NF P 96-105, NF P 98-351, etc.). ? adapter selon le projet.`;

    const derogs = access.derogations?.trim()
      ? `D?rogations sollicit?es: ${access.derogations}`
      : `D?rogations: Aucune.`;

    return (section("Principes d?accessibilit?", infos) + section("R?f?rences", refs) + section("D?rogations", derogs) + (customAccess ? section("Pr?cisions compl?mentaires", customAccess) : "")).trim();
  }, [access, customAccess]);

  async function exportPDF() {
    if (!previewRef.current) return;
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const container = previewRef.current;
      // Render with html2canvas to preserve styles across pages
      // Split the content per section blocks for pagination
      const blocks = Array.from(container.querySelectorAll(".pdf-block")) as HTMLElement[];
      let firstPage = true;
      for (const block of blocks) {
        const canvas = await html2canvas(block, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false
        });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 72; // 1 inch margin left+right
        const ratio = imgWidth / canvas.width;
        const imgHeight = canvas.height * ratio;
        const x = 36;
        const y = 48;
        if (!firstPage) {
          doc.addPage();
        }
        firstPage = false;
        if (imgHeight <= pageHeight - 96) {
          doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        } else {
          // Slice tall content across multiple pages
          let sY = 0;
          const sliceHeight = Math.floor(((pageHeight - 96) / ratio));
          while (sY < canvas.height) {
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = Math.min(sliceHeight, canvas.height - sY);
            const ctx = sliceCanvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(canvas, 0, sY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
            }
            const sliceImg = sliceCanvas.toDataURL("image/png");
            const h = sliceCanvas.height * ratio;
            doc.addImage(sliceImg, "PNG", x, y, imgWidth, h);
            sY += sliceHeight;
            if (sY < canvas.height) doc.addPage();
          }
        }
      }
      doc.save("notices_erp.pdf");
    } finally {
      setBusy(false);
    }
  }

  const effectifTotal = useMemo(() => computeEffectifTotal(erp), [erp]);

  return (
    <div className="grid">
      <div className="card no-print">
        <div className="section-title">Donn?es du projet</div>
        <div className="row">
          <div>
            <label>Ma?tre d?ouvrage</label>
            <input value={project.maitreOuvrage} onChange={e => setProject({ ...project, maitreOuvrage: e.target.value })} />
          </div>
          <div>
            <label>Architecte</label>
            <input value={project.architecte} onChange={e => setProject({ ...project, architecte: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Intitul? de l?op?ration</label>
            <input value={project.operation} onChange={e => setProject({ ...project, operation: e.target.value })} />
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={project.date} onChange={e => setProject({ ...project, date: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Adresse</label>
            <input value={project.adresse} onChange={e => setProject({ ...project, adresse: e.target.value })} />
          </div>
          <div className="row">
            <div>
              <label>Code postal</label>
              <input value={project.codePostal} onChange={e => setProject({ ...project, codePostal: e.target.value })} />
            </div>
            <div>
              <label>Commune</label>
              <input value={project.commune} onChange={e => setProject({ ...project, commune: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="row">
          <div>
            <label>D?partement</label>
            <input value={project.departement} onChange={e => setProject({ ...project, departement: e.target.value })} />
          </div>
          <div />
        </div>

        <div className="section-title">Classement et effectifs (ERP)</div>
        <div className="row">
          <div>
            <label>Type d??tablissement</label>
            <select value={erp.typeEtab} onChange={e => setErp({ ...erp, typeEtab: e.target.value as EPRInfo["typeEtab"] })}>
              {"ABCDEFGHJKLMNOPRSTUWX".split("").map(t => <option key={t} value={t}>{t}</option>)}
              <option value="PA">PA (plein air)</option>
            </select>
          </div>
          <div>
            <label>Cat?gorie</label>
            <select value={erp.categorie} onChange={e => setErp({ ...erp, categorie: e.target.value })}>
              {Array.from({ length: 5 }, (_, i) => String(i + 1)).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Neuf / Existant</label>
            <select value={erp.neufOuExistant} onChange={e => setErp({ ...erp, neufOuExistant: e.target.value as any })}>
              <option value="neuf">Neuf</option>
              <option value="existant">Existant</option>
            </select>
          </div>
          <div>
            <label>Niveaux (ex: R+1, R+2)</label>
            <input value={erp.niveaux} onChange={e => setErp({ ...erp, niveaux: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Surface utile (m?)</label>
            <input inputMode="numeric" value={erp.surfaceUtile} onChange={e => setErp({ ...erp, surfaceUtile: e.target.value })} />
          </div>
          <div className="row">
            <div>
              <label>Effectif public</label>
              <input inputMode="numeric" value={erp.effectifPublic} onChange={e => setErp({ ...erp, effectifPublic: e.target.value })} />
            </div>
            <div>
              <label>Effectif personnel</label>
              <input inputMode="numeric" value={erp.effectifPersonnel} onChange={e => setErp({ ...erp, effectifPersonnel: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Effectif r?sidents</label>
            <input inputMode="numeric" value={erp.effectifResident} onChange={e => setErp({ ...erp, effectifResident: e.target.value })} />
          </div>
          <div>
            <label>Effectif total (auto)</label>
            <input value={String(effectifTotal)} readOnly />
          </div>
        </div>
        <div className="row">
          <div>
            <label>SSI (cat?gorie)</label>
            <select value={erp.ssiCategorie} onChange={e => setErp({ ...erp, ssiCategorie: e.target.value as any })}>
              {(["A","B","C","D","E","Sans"] as const).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label>Alarme (type)</label>
            <select value={erp.alarmeType} onChange={e => setErp({ ...erp, alarmeType: e.target.value as any })}>
              {(["1","2a","2b","3","4","Sans"] as const).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>R?action au feu (rev?tements)</label>
            <input value={erp.reactionF} onChange={e => setErp({ ...erp, reactionF: e.target.value })} />
          </div>
          <div>
            <label>R?sistance au feu (structure/cloisons)</label>
            <input value={erp.resistanceF} onChange={e => setErp({ ...erp, resistanceF: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>D?senfumage</label>
            <input value={erp.desordreFumees} onChange={e => setErp({ ...erp, desordreFumees: e.target.value })} />
          </div>
          <div>
            <label>D?gagements / ?vacuation</label>
            <input value={erp.degagements} onChange={e => setErp({ ...erp, degagements: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Moyens de secours</label>
            <input value={erp.moyensSecours} onChange={e => setErp({ ...erp, moyensSecours: e.target.value })} />
          </div>
          <div />
        </div>

        <div className="section-title">Accessibilit?</div>
        <div className="row">
          <div>
            <label>Cheminements</label>
            <input value={access.cheminements} onChange={e => setAccess({ ...access, cheminements: e.target.value })} />
          </div>
          <div>
            <label>Stationnement</label>
            <input value={access.stationnement} onChange={e => setAccess({ ...access, stationnement: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Escaliers</label>
            <input value={access.escaliers} onChange={e => setAccess({ ...access, escaliers: e.target.value })} />
          </div>
          <div>
            <label>Ascenseur</label>
            <input value={access.ascenseur} onChange={e => setAccess({ ...access, ascenseur: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Portes & circulations</label>
            <input value={access.portes} onChange={e => setAccess({ ...access, portes: e.target.value })} />
          </div>
          <div>
            <label>Sanitaires PMR</label>
            <input value={access.sanitaires} onChange={e => setAccess({ ...access, sanitaires: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Signal?tique</label>
            <input value={access.signaletique} onChange={e => setAccess({ ...access, signaletique: e.target.value })} />
          </div>
          <div>
            <label>?clairage</label>
            <input value={access.eclairage} onChange={e => setAccess({ ...access, eclairage: e.target.value })} />
          </div>
        </div>
        <div>
          <label>D?rogations</label>
          <input value={access.derogations} onChange={e => setAccess({ ...access, derogations: e.target.value })} />
        </div>

        <div className="section-title">Notes compl?mentaires</div>
        <div className="row">
          <div>
            <label>Pr?cisions s?curit? incendie</label>
            <textarea value={customIncendie} onChange={e => setCustomIncendie(e.target.value)} />
          </div>
          <div>
            <label>Pr?cisions accessibilit?</label>
            <textarea value={customAccess} onChange={e => setCustomAccess(e.target.value)} />
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={exportPDF} disabled={busy}>
            {busy ? "G?n?ration?" : "T?l?charger en PDF"}
          </button>
          <button className="btn secondary" onClick={() => window.print()}>
            Imprimer
          </button>
          <button className="btn ghost" onClick={() => { setProject(defaultProject); setErp(defaultERP); setAccess(defaultAcc); setCustomIncendie(""); setCustomAccess(""); }}>
            R?initialiser
          </button>
        </div>
      </div>

      <div className="preview" ref={previewRef}>
        <div className="pdf-block">
          <h2>Notice de s?curit? incendie</h2>
          <p className="muted">Document de principe ? compl?ter ? soumission bureau de contr?le</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{noticeIncendie}</pre>
        </div>
        <hr style={{ border: "1px solid var(--border)", margin: "18px 0" }} />
        <div className="pdf-block">
          <h2>Notice d?accessibilit?</h2>
          <p className="muted">Conforme aux exigences en vigueur ? ? adapter selon le programme</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{noticeAccess}</pre>
        </div>
      </div>
    </div>
  );
}

