# Privacy Monitor - Extensão para Firefox

Esta é a extensão de privacidade desenvolvida para o Roteiro 4. Ela tem como objetivo detectar e alertar o usuário sobre diversas técnicas modernas de rastreamento na web.

## Instalação (Ambiente de Desenvolvimento)

Para instalar a extensão no Firefox e testá-la em ambiente controlado:

1. Abra o Firefox e digite `about:debugging` na barra de endereços.
2. Clique em **"Este Firefox"** (This Firefox) no menu lateral.
3. Na seção "Extensões Temporárias", clique em **"Carregar Extensão Temporária..."** (Load Temporary Add-on...).
4. Navegue até a pasta `privacy_extension` deste repositório e selecione o arquivo `manifest.json`.
5. A extensão agora está instalada e o ícone de escudo 🛡️ aparecerá na sua barra de ferramentas.

## Como Usar e Testar

1. Acesse diferentes sites e clique no ícone da extensão para ver as análises.
2. Para testar a detecção de **Fingerprinting**: Visite sites como [fingerprintable.org](https://fingerprintable.org) ou [amiunique.org](https://amiunique.org).
3. Para testar o carregamento de conexões de **terceiros e cookies**: Visite sites de notícias ou portais grandes que possuem muitos anúncios e rastreadores embutidos.

## Metodologia do Privacy Score (Pontuação de Privacidade)

A Pontuação de Privacidade (Privacy Score) começa em **100 pontos**. A página vai perdendo pontos à medida que técnicas invasivas de rastreamento são detectadas pela extensão.

As penalidades aplicadas são:
*   **-1 Ponto** por cada conexão a um **Domínio de Terceira Parte**. (Rastreamento comum e publicidade).
*   **-5 Pontos** se a página utilizar o **Web Storage ou IndexedDB**. (Possível armazenamento de rastreamento local).
*   **-2 Pontos** por quantidade de **Cookies detectados**. (Representando risco de persistência de identificadores).
*   **-15 Pontos** por cada tentativa de **Browser Fingerprinting** detectada através do Canvas, WebGL ou AudioContext. (Considerada técnica altamente agressiva de rastreamento).
*   **-10 Pontos** se supercookies (via headers ETag ou HSTS) vindos de domínios de terceira parte forem detectados.
*   **-20 Pontos** se for detectado um redirecionamento forçado ou injeção de script suspeito (possível *Hijacking/Hooking*).

O Score nunca será menor que 0.
*   **Score Verde (80-100):** Navegação relativamente segura.
*   **Score Amarelo (50-79):** Rastreamento moderado detectado.
*   **Score Vermelho (< 50):** Alta violação de privacidade / Rastreamento pesado detectado.
