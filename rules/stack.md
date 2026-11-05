# Stack fixa

| Peça | Escolha | Observação |
|---|---|---|
| Monorepo | **Nx** | cache, "só o afetado", limites entre módulos |
| Back | **NestJS** | um módulo por área, com domínio/aplicação/infra/apresentação; validação nos DTOs; OpenAPI pelo `@nestjs/swagger` |
| Front | **Angular** | signals; `input()`/`output()`; view-model com `computed()` |
| Banco | **Postgres + Prisma** | Prisma só na infraestrutura, atrás das portas |
| Testes | **Vitest** no front e no back | |
| Design system | **Spartan** (shadcn para Angular) | |
| Responsivo e e2e | **Playwright** | |
| Ambiente | **Tudo em Docker** | o host só precisa de Docker e `make` |

**Por quê fixa:** uma stack só faz as regras, o template e os pacotes valerem para todo projeto. Trocar uma peça
é decisão do ligeirinho, não do projeto.

## Docker (lições do Plidio)

| Regra | Por quê |
|---|---|
| Uma imagem de ferramentas (**toolbox**) com tudo fixado em versão exata | mesma versão em todo lugar; nada instalado no host |
| **Toolbox sempre de pé** no desenvolvimento; hooks e testes com `docker compose exec` | quase instantâneo. No Plidio cada commit subia um container novo e custava segundos |
| Container novo (`run --rm`) só no gate final e no CI | o gate prova que funciona do zero |
| Dependências em volumes (`node_modules`, store do pnpm), **nunca na pasta montada** | pasta montada é lenta no Mac |
| Cache de tarefas do Nx compartilhado entre worktrees | sessões paralelas não refazem o mesmo trabalho |
| Gate só do que mudou (Nx affected); mudança de infra roda tudo | rápido sem perder segurança |
| **Lock da máquina** para os gates: um por vez entre sessões paralelas | dois gates juntos estouram a memória da VM |
| Exit 137 é avisado como **falta de memória**, não como bug | evita caçar bug que não existe |
| Concorrência limitada; o gate derruba o stack de dev antes de rodar; serviços de teste separados | memória previsível |

**Quem cobra:** o `template/` já vem assim; o script de gate do plugin (`scripts/gate.sh`) aplica o lock e
traduz o exit 137.
