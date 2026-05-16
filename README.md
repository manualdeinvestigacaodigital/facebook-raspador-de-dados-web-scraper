<p align="center">
  <img src="https://raw.githubusercontent.com/manualdeinvestigacaodigital/facebook-raspador-de-dados-web-scraper/main/Face.png" width="140">
</p>

<h1 align="center">Raspador (WebScraper) de Dados e Mensagens do Facebook</h1>

<p align="center">
  <img src="https://img.shields.io/badge/status-estável-success">
  <img src="https://img.shields.io/badge/version-v1.0-blue">
  <img src="https://img.shields.io/badge/platform-Chrome-lightgrey">
  <img src="https://img.shields.io/badge/focus-OSINT-orange">
  <img src="https://img.shields.io/badge/license-Uso%20educacional-important">
</p>

---

<h2 align="center">🎬 Demonstração de Uso da Ferramenta</h2>

<p align="center">
  ▶️ Abaixo, vídeo demonstrando a execução prática da ferramenta em ambiente real:
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=2O1NJbJ2zIA">
    <img src="https://img.youtube.com/vi/2O1NJbJ2zIA/maxresdefault.jpg" width="600">
  </a>
</p>

<p align="center">
  <b>▶️ Clique para assistir ao vídeo completo no YouTube</b>
</p>

---

# 🔎 RASPADOR (WEBSCRAPER) DE DADOS E MENSAGENS DO FACEBOOK

Ferramenta baseada em extensão para navegador desenvolvida para coleta estruturada de dados da plataforma Facebook, voltada à investigação digital, inteligência e OSINT.

A aplicação permite extrair metadados completos de postagens, informações da página, conteúdos multimídia, comentários e interações, organizando os dados de forma estruturada para análise e exportação.

O sistema atua diretamente no ambiente do navegador, realizando leitura do DOM da página e interação com elementos dinâmicos, possibilitando a recuperação de informações que não estão visíveis de forma estruturada ao usuário comum.

---

# ⚙️ FASE 1 — PREPARAÇÃO DO AMBIENTE

Antes de utilizar a ferramenta, é necessário possuir:

- 🟢 Navegador Google Chrome ou outro navegador baseado em Chromium
- 🟢 Acesso à plataforma Facebook
- 🟢 Permissão para instalar extensões em modo desenvolvedor

---

# 🔍 FASE 2 — VERIFICAÇÃO DO AMBIENTE

Certifique-se de que:

- ✔ O Google Chrome está atualizado
- ✔ A página do Facebook carrega normalmente
- ✔ O modo desenvolvedor está habilitado no navegador

---

# 📥 FASE 3 — DOWNLOAD DA FERRAMENTA

Existem duas formas distintas para realizar o download da ferramenta:

1. 📦 Download direto pela página do projeto no GitHub, sem necessidade de instalar o Git.
2. 🖥️ Download via Git, executando comandos no Prompt de Comando, PowerShell ou Terminal.

A seguir, serão descritas detalhadamente ambas as possibilidades.

---

## 📦 OPÇÃO 1 — DOWNLOAD DIRETO PELA PÁGINA DO PROJETO

Também é possível baixar a ferramenta diretamente pelo GitHub, sem utilizar o Git.

### 🌐 Passo a passo

1. Acesse o repositório:

    https://github.com/manualdeinvestigacaodigital/facebook-raspador-de-dados-web-scraper

2. Clique no botão verde **`<> Code`**.

3. Selecione a opção **`Download ZIP`**.

4. Aguarde o download do arquivo compactado.

5. Extraia o conteúdo do arquivo ZIP em uma pasta de sua preferência.

---

## 🖥️ OPÇÃO 2 — DOWNLOAD VIA GIT

O Git é uma ferramenta amplamente utilizada para baixar e atualizar projetos hospedados no GitHub.

### 🔎 VERIFICAR SE O GIT ESTÁ INSTALADO

Abra o Prompt de Comando, PowerShell ou Terminal e execute o seguinte comando:

    git --version

### ✅ Resultado esperado

Se o Git estiver instalado corretamente, será exibida uma mensagem semelhante a:

    git version 2.49.0.windows.1

### ❌ Caso o Git não esteja instalado

Se aparecer mensagem informando que o comando `git` não é reconhecido, será necessário instalar o Git.

### 🛠️ INSTALAÇÃO DO GIT NO WINDOWS

#### 🌐 1. Acesse o site oficial do Git

    https://git-scm.com/download/win

#### 📥 2. Baixe o instalador

O download normalmente inicia automaticamente.

#### ▶️ 3. Execute o instalador

Clique duas vezes no arquivo baixado.

#### ⚙️ 4. Instalação recomendada

Durante a instalação:

- ✔ Mantenha as opções padrão
- ✔ Clique em **Next** em todas as etapas
- ✔ Ao final, clique em **Install**
- ✔ Depois, clique em **Finish**

#### 🔄 5. Reinicie o terminal

Feche e abra novamente o Prompt de Comando ou PowerShell.

#### 🔎 6. Teste novamente

    git --version

Se a versão for exibida, o Git foi instalado com sucesso.

### 🚀 CLONAR O REPOSITÓRIO

Após confirmar que o Git está instalado, execute:

    git clone https://github.com/manualdeinvestigacaodigital/facebook-raspador-de-dados-web-scraper.git

O projeto será baixado para uma pasta chamada:

    facebook-raspador-de-dados-web-scraper

---

# 🔧 FASE 4 — INSTALAÇÃO DA EXTENSÃO NO GOOGLE CHROME

Nesta fase, a pasta da ferramenta será carregada no Google Chrome como uma extensão em modo desenvolvedor.

## 🌐 1. ABRIR A PÁGINA DE EXTENSÕES DO CHROME

Abra o Google Chrome e acesse o seguinte endereço:

    chrome://extensions/

## 🛠️ 2. ATIVAR O MODO DESENVOLVEDOR

Após acessar a página de extensões do Chrome, observe o canto superior direito da tela.

Nesse local, haverá um botão escrito **Modo do desenvolvedor**.

- Caso o botão já esteja habilitado, prossiga para a próxima etapa.
- Caso o botão esteja desabilitado, clique sobre ele ou arraste-o para a direita para habilitar o **Modo do desenvolvedor**.

Quando habilitado, o Chrome passará a exibir opções adicionais para carregamento manual de extensões.

## 📂 3. CARREGAR A EXTENSÃO SEM COMPACTAÇÃO

Com o **Modo do desenvolvedor** habilitado, clique no botão:

- 👉 **Carregar sem compactação**

Em seguida, selecione a pasta do projeto:

- 📁 Se o projeto foi baixado por ZIP, selecione a pasta extraída.
- 📁 Se o projeto foi baixado por Git, selecione a pasta clonada.

Após selecionar a pasta correta:

- ✔ A extensão será carregada automaticamente no navegador.

---

# 🌐 FASE 5 — EXECUÇÃO DA FERRAMENTA

### 📄 Acesse uma postagem do Facebook em um dos formatos abaixo:

    https://www.facebook.com/reel/ID
    https://www.facebook.com/usuario/posts/ID
    https://www.facebook.com/photo.php?fbid=ID

### ▶️ Em seguida:

- Clique no ícone da extensão para iniciar.

---

# 🚀 FASE 6 — FUNCIONAMENTO DA FERRAMENTA

A ferramenta atua diretamente na página do Facebook, coletando dados em tempo real.

## 📡 COLETA DE DADOS

A aplicação realiza:

- 🔍 Leitura do DOM da página
- 🔄 Expansão automática de conteúdo
- 📜 Scroll automático de comentários
- 💬 Abertura de respostas

## 📊 EXTRAÇÃO DE METADADOS

A ferramenta identifica e extrai:

- 📌 ID da postagem
- 👤 Autor (com link)
- 📝 Legenda completa
- 📅 Data de publicação
- 🔗 URL da postagem

## 📈 ESTATÍSTICAS

Extração automática de:

- 👍 Curtidas e reações
- 💬 Comentários
- 🔁 Compartilhamentos
- 👁️ Visualizações (quando aplicável)

## 🎥 EXTRAÇÃO DE MÍDIA

A ferramenta identifica e extrai:

- 📹 Vídeos (posts e reels)
- 🖼️ Imagens (inclusive múltiplas)
- 🔗 URLs diretas de mídia

## 💬 COLETA DE COMENTÁRIOS

- 🔎 Expansão automática de comentários
- 🔁 Coleta de respostas (replies)
- 📑 Estruturação hierárquica dos dados

### ✔ Recursos adicionais

- ✔ Organização em níveis
- ✔ Preservação do conteúdo original

## 🧠 TRATAMENTO DOS DADOS

Os dados são:

- ✔ Organizados
- ✔ Padronizados
- ✔ Estruturados para análise

---

# 📁 FASE 7 — GERAÇÃO DE SAÍDAS

A ferramenta gera automaticamente:

- 📄 HTML estruturado
- 🧾 JSON completo
- 📑 Relatórios organizados

---

# 🔐 FASE 8 — INTEGRIDADE DOS DADOS

O sistema realiza geração de hash criptográfico:

- 🔐 SHA-256
- 🔐 SHA-512

Aplicados ao conteúdo exportado para garantir:

- ✔ Integridade
- ✔ Autenticidade
- ✔ Rastreabilidade

---

# 📊 FASE 9 — EXPORTAÇÃO

Os dados coletados podem conter:

- Metadados da postagem
- Conteúdo textual
- Comentários e respostas
- Links de mídia
- Estrutura hierárquica

---

# 🔄 FASE 10 — FLUXO OPERACIONAL

1. 📥 Baixar a ferramenta
2. 🔧 Instalar a extensão no Chrome
3. 📄 Abrir uma postagem no Facebook
4. ▶️ Executar o raspador
5. ⏳ Aguardar a coleta automática
6. 📁 Gerar arquivos (HTML / JSON)
7. 📊 Analisar os dados
8. 🔐 Validar a integridade via hash

---

# ⚠️ FASE 11 — LIMITAÇÕES

[Não verificado] O funcionamento pode variar conforme alterações internas do Facebook, incluindo:

- Mudanças no DOM
- Alterações na interface
- Restrições de acesso
- Diferenças entre tipos de postagem

---

# ⚠️ FASE 12 — SEGURANÇA

Evite:

- ❌ Executar em contas sensíveis
- ❌ Compartilhar dados sem validação
- ❌ Utilizar fora de contexto legal

---

# 📚 FASE 13 — REFERÊNCIA TÉCNICA E AUTORIA

Este projeto integra um conjunto mais amplo de ferramentas voltadas à investigação digital, inteligência e OSINT.

O autor deste projeto é também autor da obra:

📖 **Manual de Investigação Digital — Editora Juspodivm**

    https://www.editorajuspodivm.com.br/authors/page/view/id/206/

A obra reúne fundamentos teóricos e aplicações práticas voltadas à investigação digital contemporânea.

---

# 🧠 FASE 14 — INTEGRAÇÃO COM A OBRA

Este repositório representa uma aplicação prática das técnicas abordadas no livro, permitindo:

- ✔ Aplicação de conceitos de OSINT
- ✔ Estruturação de coleta de dados
- ✔ Organização de evidências
- ✔ Apoio à análise investigativa

---

# 👤 AUTOR

**Guilherme Caselli**
Delegado de Polícia
Autor do livro **Manual de Investigação Digital**

    https://instagram.com/guilhermecaselli

    https://www.editorajuspodivm.com.br/authors/page/view/id/206/

---

# 🎯 FINALIDADE

- 🕵️ Investigação digital
- 🧠 Inteligência
- 🌐 OSINT
- 📊 Análise de dados públicos
- 📁 Coleta estruturada de evidência digital
