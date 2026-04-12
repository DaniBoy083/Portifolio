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

GERACAO AUTOMATICA DE CURRICULO

- O botao "Gerar curriculo inteligente" (na secao inicial do site) gera curriculo automaticamente.
- O PDF gerado segue layout estruturado de curriculo (cabecalho, secoes e hierarquia visual) inspirado no modelo da pasta docs.
- O PDF inclui anexos fotograficos dos certificados ao final do documento, usando as imagens da secao Certificados da pagina.
- Modo hard de anexos: no build, as imagens da pasta img/Certificados sao embutidas em base64 e priorizadas no PDF.
- Ao clicar, o sistema pergunta o modo:
	- OK: curriculo completo
	- Cancelar: curriculo curto
- Fontes usadas no gerador:
	- Dados do proprio workspace (nome, resumo, formacao, skills, projetos e certificacoes exibidos na pagina)
	- GitHub publico (usuario, seguidores, quantidade de repositorios e repositorios em destaque)
	- LinkedIn (link publico presente na pagina)
- Saida: download local de um arquivo por geracao:
	- nome-modo-aaaa-mm-dd.pdf
- Observacao: a API publica do LinkedIn nao e consultada diretamente; o gerador referencia o link do perfil e permite complemento manual no documento final.
- Modo de emergencia da foto: o build embute img/Placeholders/minhafoto.(jpg|jpeg|png|webp) em base64 dentro de dist/build-meta.js para fallback 100% local no PDF.

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