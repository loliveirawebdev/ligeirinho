---
name: plan
description: Escreve o plano curto de uma feature do ligeirinho (regras de domínio, contrato, telas, riscos pesquisados com fontes, testes, pedaços paralelos) e pede aprovação do Lucas. Use depois do clarify, antes de qualquer código.
---

# Plano

Curto. Sem documento que ninguém relê. Só o que alguém precisa para construir e revisar.

## Antes de escrever

1. Leia as regras que a feature toca em `rules/` do plugin (no mínimo `arquitetura`, `seguranca`, `escala` e,
   se tem tela, `mvvm` e `responsivo`; se tem rota, `api-rest`).
2. **Pesquise na internet** como o problema costuma ser resolvido: padrões consagrados, docs oficiais das libs
   da stack, OWASP (API Top 10, ASVS, Cheat Sheets). Guarde as URLs.

## Formato (nessa ordem, cada seção só se a feature tiver)

```markdown
## Plano — NNN-nome

### O que muda e por quê
Regras de domínio novas ou alteradas, em frases do negócio. Áreas tocadas.

### Contrato da API
| Método | Rota | Quem pode | Corpo / query | Respostas |
Erros no formato Problem Details com o `type` de cada erro de negócio.

### Telas
Para cada tela: view, view-model (campos), cenários (vazia, cheia, erro, só leitura…), página (o que busca).

### Riscos e padrões
Segurança, escala e zero trust: para cada risco, o padrão escolhido e a fonte (URL).
Operações sensíveis que geram auditoria. Consultas novas e o índice de cada uma. Idempotência onde couber.

### Decisões técnicas
O que você decidiu sozinho e por quê (uma linha cada).

### Testes
- Unidade: …
- Componente: …
- Integração / autorização: quem pode, quem não pode, sem login, outro dono
- E2E: jornadas tocadas (jornada crítica nova precisa de e2e)

### Pedaços
1. … (independente)
2. … (independente)
3. … (depende de 1)
```

## Aprovação

Mostre o plano e peça aprovação ao Lucas. Ajuste até ele aprovar. Depois:

1. Salve o plano aprovado na nota da feature (seções **Decisões** e **Contrato**).
2. Rode `scripts/estado.sh NNN-nome preview` (ou `build`, se não tem tela).
3. Siga para `ligeirinho:preview` ou `ligeirinho:build`.
