# API REST

O contrato é o OpenAPI gerado pelo `@nestjs/swagger`. O plano escreve o contrato antes do código (rotas, campos,
erros); o Spectral confere o OpenAPI gerado no gate.

## Regras (herdadas do `rest_check.py` do Plidio)

| Regra | Exemplo errado → certo | Por quê |
|---|---|---|
| Segmentos em **kebab-case** | `/tiposDeIngresso` → `/tipos-de-ingresso` | um padrão só, legível na URL |
| **Sem verbo no caminho** (approve, cancel, create, delete, send, verify, login, update, get…) | `POST /inscricoes/1/cancel` → `POST /inscricoes/1/cancelamentos` ou `PATCH` do estado | o método HTTP é o verbo; recurso é substantivo |
| **Sem nome de front/chamador** no caminho (admin, backoffice, internal, public, app, web…) | `/admin/eventos` → `/eventos` com autorização por papel | quem pode chamar é autorização, não URL |
| **Sem segredo em path/query** (code, password, secret, token, key…) | `GET /convites?token=…` → token no corpo ou header | URL vai para log e histórico |
| `POST` de criação responde **201** e `Location` quando o recurso é legível | | cliente sabe onde está o que criou |
| Coleção com **paginação** | | ver [escala.md](escala.md) |
| Erro no formato **Problem Details** (RFC 9457) | | um formato de erro para todo cliente |

Exceções só por nome: `/oauth2/*`, `/health`, `/me`, `/.well-known/*`.

**Quem cobra:** Spectral com o `spectral-ruleset` do ligeirinho, no gate. Nova exceção exige mudança no
`.ligeirinho.yml` do projeto com comentário do motivo.
