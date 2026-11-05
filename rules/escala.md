# Escala

| Regra | Por quê | Quem cobra |
|---|---|---|
| **Listagem sempre paginada** (cursor por padrão; limite máximo no servidor) | lista sem limite derruba API e banco quando a tabela cresce (OWASP API4) | Spectral: `GET` de coleção sem parâmetros de paginação quebra; checklist |
| **Índice para cada consulta nova** | consulta sem índice é rápida no dev e lenta em produção | checklist do plano (cada consulta nova cita o índice); teste de integração pode rodar `EXPLAIN` nas consultas críticas |
| **Sem N+1** | uma consulta por item multiplica a latência | checklist; Prisma com `include`/`select` explícito; teste de integração conta consultas nos casos de uso de listagem |
| **Idempotência em operação repetível** (`Idempotency-Key` em `POST` que cria ou cobra) | rede refaz requisição; sem chave, cria duas vezes | checklist do plano para operações que mexem em dinheiro, envio ou criação via cliente instável |
| **Rate limit** em toda rota, mais apertado em login, convite e envio | abuso e força bruta (OWASP API4, API6) | guard global no template; checklist para rota sensível |
| **Cache só com regra clara de invalidação** escrita no doc da área | cache sem regra mostra dado velho e ninguém sabe por quê | checklist |
| **Trabalho pesado em fila** (e-mail, relatório, integração externa) | requisição HTTP não espera trabalho lento | checklist |
| **Outbox** para evento que não pode se perder | gravar no banco e publicar na fila não é atômico; outbox é | checklist do plano |
