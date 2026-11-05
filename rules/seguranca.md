# Segurança e zero trust

Zero trust é a filosofia de tudo: nenhuma requisição, serviço ou dado é confiável só por estar "dentro".

## Negar por padrão

Rota, papel ou entidade nova não dá acesso a nada até ser liberada explicitamente. No Nest, um guard global exige
autenticação e uma permissão declarada em toda rota; rota sem declaração responde 403. Rota pública é declarada
com `@Publica()` e aparece na revisão.

**Por quê:** esquecer de proteger é o erro mais comum (OWASP API1 e API5). Com negação padrão, esquecer fecha em
vez de abrir.

**Quem cobra:** teste de arquitetura que percorre todas as rotas registradas e falha se alguma não tiver
permissão nem `@Publica()`; checklist para cada `@Publica()` nova.

## Verificar sempre

Toda requisição é autenticada e autorizada, inclusive entre serviços internos. Autorização olha **o objeto**
(esta inscrição é deste usuário?), não só o papel.

**Por quê:** autorização por objeto quebrada (BOLA, OWASP API1) é a falha número um em APIs.

**Quem cobra:** teste de autorização de cada rota (abaixo); checklist para consulta que busca por id sem filtrar
pelo dono/tenant.

## Toda rota nova tem teste de quem pode e quem não pode

Para cada rota: um teste com quem pode (sucesso), um com cada papel que não pode (403), um sem autenticação (401)
e, se a rota recebe id, um com o id de outro dono (404, para não vazar existência).

**Quem cobra:** o plano lista esses testes; o fechamento confere.

## Menor privilégio

Cada token, usuário, serviço e conexão só com o que precisa. Usuário do banco da aplicação não é dono do schema
(migração roda com outro usuário). Token com escopo e validade curta.

**Quem cobra:** checklist; template já cria usuários separados no Postgres.

## Validar em toda borda

API, filas, respostas de serviços externos e **variáveis de ambiente na subida** (schema que derruba a aplicação
se faltar ou estiver errada).

**Quem cobra:** `ValidationPipe` global; schema de env no bootstrap do template; checklist para adaptador externo
que não valida a resposta.

## Segredo nunca no código, em log ou em URL

Segredo vem de variável de ambiente ou cofre. Logger com lista de campos redigidos (`password`, `token`,
`authorization`, `secret`, `cookie`…). Nada sensível em query string (fica em log de proxy e histórico).

**Quem cobra:** Spectral (sem segredo em path/query, ver [api-rest.md](api-rest.md)); gitleaks no gate; checklist
para log.

## Mudança sensível gera evento de auditoria

Mudança de permissão, dado pessoal, dinheiro, configuração de segurança e login/logout geram evento de auditoria
(quem, o quê, quando, de onde), gravado de forma que a aplicação não consiga apagar.

**Quem cobra:** o plano marca as operações sensíveis; o fechamento confere o evento e o teste dele.

## Referências que o plano consulta

- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/

O plano pesquisa como o problema da feature costuma ser resolvido e **cita as fontes**.
