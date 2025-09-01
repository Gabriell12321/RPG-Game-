// Sistema de cutscene com sussurros
(function() {
    // Elementos DOM
    let container, textElement, buttonElement, characterElement;
    let currentMessage = '';
    let isTransitioning = false;
    let audioContext = null;
    
    // Configurações
    const config = {
        characterSpeed: 50,  // ms por caractere
        showButton: true,    // mostrar botão continuar
        audioEnabled: true   // habilitar áudio
    };
    
    // Mensagens da cutscene
    const messages = [
        "As sombras parecem se mover ao seu redor...",
        "Você sente uma presença observando cada passo seu...",
        "Não confie no que seus olhos veem...",
        "Há segredos escondidos nas paredes desta casa..."
    ];
    
    let currentMessageIndex = 0;
    
    // Inicializa a cutscene
    function init() {
        // Criar elementos
        container = document.createElement('div');
        container.className = 'cutscene-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #a00;
            font-family: 'Courier New', monospace;
        `;
        
        // Elemento do personagem simples
        characterElement = document.createElement('div');
        characterElement.className = 'cutscene-character';
        characterElement.style.cssText = `
            width: 60px;
            height: 120px;
            margin-bottom: 80px;
            position: relative;
        `;
        
        // Cabeça do personagem
        const head = document.createElement('div');
        head.style.cssText = `
            width: 40px;
            height: 40px;
            background-color: #FFDEB3;
            border-radius: 8px;
            position: absolute;
            top: 0;
            left: 10px;
        `;
        
        // Olhos do personagem
        const eyes = document.createElement('div');
        eyes.style.cssText = `
            position: relative;
            top: 15px;
            display: flex;
            justify-content: space-around;
            width: 30px;
            margin: 0 auto;
        `;
        
        const eye1 = document.createElement('div');
        eye1.style.cssText = `
            width: 6px;
            height: 6px;
            background-color: #000;
            border-radius: 50%;
        `;
        
        const eye2 = document.createElement('div');
        eye2.style.cssText = `
            width: 6px;
            height: 6px;
            background-color: #000;
            border-radius: 50%;
        `;
        
        eyes.appendChild(eye1);
        eyes.appendChild(eye2);
        head.appendChild(eyes);
        
        // Corpo do personagem
        const body = document.createElement('div');
        body.style.cssText = `
            width: 50px;
            height: 60px;
            background-color: #4169E1;
            position: absolute;
            top: 40px;
            left: 5px;
            border-radius: 8px;
        `;
        
        characterElement.appendChild(head);
        characterElement.appendChild(body);
        container.appendChild(characterElement);
        
        // Elemento de texto
        textElement = document.createElement('div');
        textElement.className = 'cutscene-text';
        textElement.style.cssText = `
            font-size: 24px;
            text-align: center;
            max-width: 80%;
            min-height: 60px;
            margin-bottom: 50px;
            text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
        `;
        container.appendChild(textElement);
        
        // Botão continuar
        buttonElement = document.createElement('div');
        buttonElement.className = 'cutscene-button';
        buttonElement.textContent = 'Continuar';
        buttonElement.style.cssText = `
            padding: 10px 30px;
            background-color: #600;
            color: white;
            border: 2px solid #800;
            cursor: pointer;
            font-size: 18px;
            opacity: 0;
            transition: opacity 1s, transform 0.3s;
            border-radius: 5px;
        `;
        
        buttonElement.addEventListener('mouseover', () => {
            buttonElement.style.transform = 'scale(1.05)';
            buttonElement.style.backgroundColor = '#800';
        });
        
        buttonElement.addEventListener('mouseout', () => {
            buttonElement.style.transform = 'scale(1)';
            buttonElement.style.backgroundColor = '#600';
        });
        
        buttonElement.addEventListener('click', nextMessage);
        
        container.appendChild(buttonElement);
        
        // Inicializar áudio
        initAudio();
        
        // Adicionar ao body
        document.body.appendChild(container);
        
        // Iniciar com a primeira mensagem
        showMessage(messages[currentMessageIndex]);
        
        // Também permitir avançar com tecla Enter ou Espaço
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && buttonElement.style.opacity === '1') {
                nextMessage();
            }
        });
    }
    
    // Inicializar áudio
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.error("Áudio não suportado:", e);
            config.audioEnabled = false;
        }
    }
    
    // Tocar sussurro
    function playWhisper(text) {
        if (!audioContext || !config.audioEnabled) return;
        
        try {
            // Criar fonte de ruído branco para o sussurro
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Preencher com ruído com variação baseada no texto
            const textLength = text.length;
            const intensity = Math.min(0.05 + (textLength / 500), 0.15); // Ajusta intensidade baseada no tamanho do texto
            
            for (let i = 0; i < bufferSize; i++) {
                // Ruído branco com baixa intensidade
                output[i] = (Math.random() * 2 - 1) * intensity;
            }
            
            // Modular o ruído para parecer sussurro
            const whisperSource = audioContext.createBufferSource();
            whisperSource.buffer = noiseBuffer;
            
            // Ajustar o filtro para o sussurro
            const whisperFilter = audioContext.createBiquadFilter();
            whisperFilter.type = "bandpass";
            whisperFilter.frequency.value = 1000 + (Math.random() * 1000);
            whisperFilter.Q.value = 0.5;
            
            // Criar envelope para modulação do sussurro
            const whisperGain = audioContext.createGain();
            whisperGain.gain.value = 0;
            
            // Conectar os nós
            whisperSource.connect(whisperFilter);
            whisperFilter.connect(whisperGain);
            whisperGain.connect(audioContext.destination);
            
            // Modular o volume para simular as palavras do sussurro
            const now = audioContext.currentTime;
            const duration = Math.min(0.5 + (textLength / 100), 3.0); // Duração baseada no texto
            
            // Início do sussurro (fade in)
            whisperGain.gain.setValueAtTime(0, now);
            whisperGain.gain.linearRampToValueAtTime(intensity * 3, now + 0.1);
            
            // Modulação (simula as sílabas)
            let time = now + 0.1;
            const syllableTime = duration / Math.max(textLength / 2, 4);
            
            for (let i = 0; i < textLength / 2; i++) {
                const val1 = intensity * (2 + Math.random());
                const val2 = intensity * (1 + Math.random());
                whisperGain.gain.linearRampToValueAtTime(val1, time + (syllableTime * 0.3));
                whisperGain.gain.linearRampToValueAtTime(val2, time + (syllableTime * 0.7));
                time += syllableTime;
            }
            
            // Fim do sussurro (fade out)
            whisperGain.gain.linearRampToValueAtTime(0, now + duration);
            
            // Iniciar e parar
            whisperSource.start(now);
            whisperSource.stop(now + duration);
            
        } catch(e) {
            console.error("Erro ao reproduzir sussurro:", e);
        }
    }
    
    // Exibir mensagem com efeito de digitação
    function showMessage(message) {
        if (isTransitioning) return;
        
        isTransitioning = true;
        currentMessage = message;
        textElement.textContent = '';
        buttonElement.style.opacity = '0';
        
        // Tocar som de sussurro para esta mensagem
        playWhisper(message);
        
        // Efeito de digitação
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < message.length) {
                textElement.textContent += message[charIndex];
                
                // Efeito de tremor no personagem
                if (charIndex % 3 === 0) {
                    characterElement.style.transform = `translateX(${(Math.random() - 0.5) * 3}px) translateY(${(Math.random() - 0.5) * 3}px)`;
                    setTimeout(() => {
                        characterElement.style.transform = 'translateX(0) translateY(0)';
                    }, 50);
                }
                
                charIndex++;
            } else {
                clearInterval(typeInterval);
                
                // Mostrar botão de continuar após a mensagem estar completa
                if (config.showButton) {
                    setTimeout(() => {
                        buttonElement.style.opacity = '1';
                        isTransitioning = false;
                    }, 500);
                }
            }
        }, config.characterSpeed);
    }
    
    // Avançar para a próxima mensagem
    function nextMessage() {
        if (isTransitioning) return;
        
        currentMessageIndex++;
        
        // Se ainda há mais mensagens
        if (currentMessageIndex < messages.length) {
            showMessage(messages[currentMessageIndex]);
        } else {
            // Final da cutscene - transição para o jogo
            container.style.opacity = '0';
            container.style.transition = 'opacity 2s';
            
            setTimeout(() => {
                container.remove();
                
                // Iniciar o jogo
                if (window.startGame) {
                    window.startGame();
                }
            }, 2000);
        }
    }
    
    // Função para iniciar a cutscene
    window.startCutscene = function() {
        init();
    };
    
    // Registrar ponto de entrada
    document.addEventListener('DOMContentLoaded', () => {
        // Adicionar botão na página para iniciar a cutscene
        const gameTitle = document.querySelector('.game-title');
        if (gameTitle) {
            const startButton = document.createElement('button');
            startButton.textContent = 'Iniciar Jogo';
            startButton.style.cssText = `
                padding: 10px 20px;
                font-size: 18px;
                background-color: #600;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-bottom: 20px;
                transition: background-color 0.3s;
            `;
            
            startButton.addEventListener('mouseover', () => {
                startButton.style.backgroundColor = '#800';
            });
            
            startButton.addEventListener('mouseout', () => {
                startButton.style.backgroundColor = '#600';
            });
            
            startButton.addEventListener('click', () => {
                startCutscene();
            });
            
            gameTitle.parentNode.insertBefore(startButton, gameTitle.nextSibling);
        }
    });
    
    // Exportar funções para uso externo
    window.CutsceneSystem = {
        start: startCutscene,
        playWhisper: playWhisper
    };
})();
