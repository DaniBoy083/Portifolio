RECEITAS RAPIDAS (ULTIMA ATUALIZACAO)

1) Data manual fixa
- Em index.html:
	<h4 id="ultima-atualizacao" class="ultima-atualizacao" data-manual-date="2026-04-12">Ultima atualização</h4>
- Resultado: sempre mostra a data manual.

2) Data automatica via Git
- Em index.html:
	<h4 id="ultima-atualizacao" class="ultima-atualizacao" data-manual-date="">Ultima atualização</h4>
- Antes de publicar:
	npm run build
- Resultado: usa a data do ultimo commit Git (fallback para document.lastModified).

Portifolio digital desenvolvido por Daniel Costa Carvalho Martins, com o proposito de expor projetos, habilidades e formas de contato.

Tecnologias utilizadas:
- HTML (estrutura)
- CSS (estilizacao)
- TypeScript (interacoes e metadados da pagina)
- Git/GitHub (versionamento)
- Netlify (hospedagem)

Links:
- Repositorio: https://github.com/DaniBoy083/Portifolio
- Portfolio: https://portifoliodanielcosta.netlify.app

Build:
1. Execute npm install
2. Execute npm run build

O build agora gera automaticamente o arquivo dist/build-meta.js antes da compilacao TypeScript.

Ultima atualizacao automatica:
- O texto "Ultima atualização" e preenchido pelo script src/portfolio-meta.ts.
- A prioridade da data e:
	1) Data manual no atributo data-manual-date do elemento #ultima-atualizacao
	2) Data do ultimo commit Git (gerada em dist/build-meta.js)
	3) document.lastModified (fallback automatico do navegador)

Como definir data manual:
- Edite index.html e defina o atributo data-manual-date no elemento de ultima atualizacao.
- Exemplo valido: data-manual-date="2026-04-12"
- Se o atributo estiver vazio, o portfolio usa a data do Git automaticamente.

Exemplo completo (data manual fixa):
- Em index.html, use:
	<h4 id="ultima-atualizacao" class="ultima-atualizacao" data-manual-date="2026-04-12">Ultima atualização</h4>
- Resultado: a pagina sempre mostra a data definida manualmente.

Exemplo completo (sempre data automatica do Git):
- Em index.html, use:
	<h4 id="ultima-atualizacao" class="ultima-atualizacao" data-manual-date="">Ultima atualização</h4>
- Garanta que o build seja executado antes de publicar:
	npm run build
- Resultado: a pagina usa a data do ultimo commit Git. Se nao houver Git disponivel, usa document.lastModified.