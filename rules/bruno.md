# API: coleção Bruno

| Regra | Por quê | Quem cobra |
|---|---|---|
| Coleção Bruno no repo (`bruno/`), **pastas espelhando as URLs** | achar o request de uma rota sem procurar | drift check |
| Um ambiente por lugar: `local`, `dev`, `prod` | trocar de ambiente sem editar request | — |
| Segredos em `.env` **fora do git** | segredo nunca no código (ver [seguranca.md](seguranca.md)) | gitleaks no gate |
| **Drift check** contra o OpenAPI: rota sem request, request órfão ou com corpo inválido quebra | a coleção nunca fica velha | `bruno-tools` no gate |
| Pasta `fluxos/` com requests em sequência para fluxos de várias chamadas | testar à mão um fluxo inteiro (convite → aceite → login) | — |
| Seed local (`make bruno-env`) gera dados e tokens de teste e preenche o ambiente `local` | abrir o Bruno e já sair chamando | `bruno-tools` |
