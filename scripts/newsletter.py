#!/usr/bin/env python3
"""Envia por email (Buttondown) cada texto de opinião novo.

Corre no GitHub Actions sempre que muda algo em src/content/opiniao/.
- Um texto é «novo» se não estiver em src/data/newsletter-enviados.json,
  não for rascunho, tiver data e essa data não for mais antiga do que MAX_DIAS.
- Textos com o texto completo no site: o email leva o texto completo e a ligação para a página
  (e, se saíram primeiro num jornal, a indicação «Publicado originalmente no …»).
- Textos que estão só no jornal: o email leva o resumo e a ligação para o jornal.
- Depois de enviar, o texto é acrescentado ao registo, para nunca ser enviado duas vezes.

Variáveis de ambiente:
  BUTTONDOWN_API_KEY  chave da API (segredo do repositório). Sem ela, não envia nada.
  MODO                "enviar" (normal) ou "rascunho" (cria o email no Buttondown sem o enviar).
  FORCAR              nome de um ficheiro de texto (sem .md) para o tratar mesmo que já tenha sido
                      enviado ou seja antigo. Serve para testar com MODO=rascunho.
  DRY_RUN             "1" para só mostrar o que faria (para testes).
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import yaml

SITE = "https://padroesedesvios.eu"
PASTA = Path("src/content/opiniao")
REGISTO = Path("src/data/newsletter-enviados.json")
MAX_DIAS = 14
API = "https://api.buttondown.com/v1/emails"


def ler_texto(caminho: Path):
    raw = caminho.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", raw, re.S)
    if not m:
        return None
    dados = yaml.safe_load(m.group(1)) or {}
    dados["corpo"] = m.group(2).strip()
    dados["id"] = caminho.stem
    return dados


def data_de(d):
    if isinstance(d, dt.datetime):
        return d.date()
    if isinstance(d, dt.date):
        return d
    if isinstance(d, str) and d.strip():
        return dt.date.fromisoformat(d.strip()[:10])
    return None


def juntar_nomes(nomes):
    nomes = [n for n in (nomes or []) if n]
    if len(nomes) < 2:
        return "".join(nomes)
    return ", ".join(nomes[:-1]) + " e " + nomes[-1]


def em_outlet(o):
    o = (o or "").strip()
    if re.match(r"^A\s", o):
        return "na " + o[2:]
    if re.match(r"^(Revista|Folha|Gazeta|Visão|Sábado)\b", o, re.I):
        return "na " + o
    return "no " + o


MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
         "setembro", "outubro", "novembro", "dezembro"]


def montar_email(t):
    nativo = bool(t["corpo"]) or (not t.get("url") and not t.get("outlet"))
    autores = juntar_nomes(t.get("authors") or ["Tiago Neves", "Gil Nata"])
    resumo = (t.get("summary") or "").strip()
    partes = []
    if nativo:
        link = f"{SITE}/opiniao/{t['id']}/"
        corpo = t["corpo"]
        # Imagens e ligações internas passam a endereços completos.
        corpo = re.sub(r"\]\((/[^)\s]*)", lambda m: f"]({SITE}{m.group(1)}", corpo)
        corpo = re.sub(r'src="(/[^"]*)"', lambda m: f'src="{SITE}{m.group(1)}"', corpo)
        partes.append(f"*Por {autores}*")
        if resumo:
            partes.append(f"**{resumo}**")
        partes.append(corpo)
        if t.get("outlet"):
            d = data_de(t.get("date"))
            quando = f", a {d.day} de {MESES[d.month - 1]} de {d.year}" if d else ""
            partes.append(f"*Publicado originalmente {em_outlet(t['outlet'])}{quando}.*")
        partes.append(f"[Ler no site Padrões e Desvios]({link})")
    else:
        link = t.get("url") or f"{SITE}/#opiniao"
        partes.append(f"Novo texto de opinião de {autores}, publicado {em_outlet(t.get('outlet') or 'jornal')}.")
        if resumo:
            partes.append(resumo)
        partes.append(f"[Ler o texto]({link})")
    return {"subject": t["title"], "body": "\n\n".join(partes)}, (link if nativo else None)


def esperar_pagina(url, minutos=12):
    """Espera que o Cloudflare publique a página do texto antes de enviar o email."""
    fim = time.time() + minutos * 60
    while time.time() < fim:
        try:
            req = urllib.request.Request(url, method="GET", headers={"User-Agent": "padroes-e-desvios-newsletter"})
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(30)
    return False


def enviar(payload, chave, modo):
    dados = dict(payload, status="draft" if modo == "rascunho" else "about_to_send")
    req = urllib.request.Request(
        API,
        data=json.dumps(dados).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Token {chave}",
            "Content-Type": "application/json",
            "X-API-Version": "2026-04-01",
            # Confirmação exigida pelo Buttondown no primeiro envio pela API.
            "X-Buttondown-Live-Dangerously": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        print(f"Erro do Buttondown ({e.code}): {e.read().decode('utf-8', 'replace')}", file=sys.stderr)
        raise


def main():
    chave = os.environ.get("BUTTONDOWN_API_KEY", "").strip()
    modo = os.environ.get("MODO", "enviar").strip() or "enviar"
    dry = os.environ.get("DRY_RUN") == "1"
    forcar = os.environ.get("FORCAR", "").strip().removesuffix(".md")
    hoje = dt.date.today()

    enviados = json.loads(REGISTO.read_text(encoding="utf-8")) if REGISTO.exists() else []
    novos = []
    for f in sorted(PASTA.glob("*.md")):
        if f.name.startswith("_"):
            continue
        t = ler_texto(f)
        if t and forcar and t["id"] == forcar:
            novos.append(t)
            continue
        if forcar or not t or t.get("draft") or t["id"] in enviados:
            continue
        d = data_de(t.get("date"))
        if not d or d > hoje or (hoje - d).days > MAX_DIAS:
            continue
        novos.append(t)

    if not novos:
        print(f"Não encontrei o texto «{forcar}»." if forcar else "Nenhum texto novo para enviar.")
        return
    if not chave and not dry:
        print("::warning::Há textos novos, mas falta o segredo BUTTONDOWN_API_KEY. Nada foi enviado.")
        return

    for t in novos:
        payload, pagina = montar_email(t)
        print(f"→ {t['id']}: «{payload['subject']}» ({modo})")
        if dry:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            continue
        if pagina and not esperar_pagina(pagina):
            print(f"::warning::A página {pagina} ainda não está publicada; o envio fica para a próxima vez.")
            continue
        enviar(payload, chave, modo)
        if modo == "enviar" and t["id"] not in enviados:
            enviados.append(t["id"])
            REGISTO.write_text(json.dumps(enviados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("  feito.")


if __name__ == "__main__":
    main()
