// Sistema de Pixel Art com Arrays JavaScript
// Cada personagem é representado por uma matriz 2D onde:
// Cada caractere representa uma cor diferente
// '.' = transparente
// Você pode alterar o mapeamento de cores conforme necessário

// Personagem Bob
const bob = [
    '...BBBB...',  // 0 - Cabelo
    '..BBBBBB..',  // 1
    '.SSSSSSSS.',  // 2 - Rosto
    '.SEESEESS.',  // 3 - Olhos
    '.SSSSSSSS.',  // 4
    '.SSSSSSSS.',  // 5
    '..SSSSSS..',  // 6 - Pescoço
    '.AAAAAAAA.',  // 7 - Camisa
    'AAAAAAAAAA',  // 8
    '.AAAAAAAA.',  // 9
    '..AAAAAA..',  // 10
    '..PPPPPP..',  // 11 - Calças
    '..PPPPPP..',  // 12
    '..PP..PP..',  // 13 - Pernas
    '..PP..PP..',  // 14
    '..MM..MM..'   // 15 - Sapatos
];

// Mapeamento de cores
const colorMap = {
    '.': 'transparent',    // Transparente
    'B': '#8B4513',        // Cabelo marrom
    'S': '#F4C2A1',        // Pele
    'E': '#000000',        // Olhos
    'A': '#4169E1',        // Camisa azul
    'P': '#2F4F4F',        // Calças cinza escuro
    'M': '#654321'         // Sapatos marrons
};

// Função para renderizar o personagem
function renderCharacter(character, pixelSize = 10, targetElement = null) {
    // Criar um elemento canvas
    const canvas = document.createElement('canvas');
    const width = character[0].length * pixelSize;
    const height = character.length * pixelSize;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.imageRendering = 'pixelated';
    
    const ctx = canvas.getContext('2d');
    
    // Desenhar cada pixel
    for (let y = 0; y < character.length; y++) {
        const row = character[y];
        for (let x = 0; x < row.length; x++) {
            const colorKey = row[x];
            if (colorKey !== '.') {  // Não desenhar pixels transparentes
                ctx.fillStyle = colorMap[colorKey] || '#FF00FF'; // Magenta para códigos desconhecidos
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    // Anexar ao elemento alvo ou retornar o canvas
    if (targetElement) {
        targetElement.appendChild(canvas);
    }
    return canvas;
}

// Função para exportar o personagem como uma string JavaScript
function exportCharacterCode(character) {
    let code = '// Personagem em Pixel Art\n';
    code += 'const character = [\n';
    character.forEach(row => {
        code += `    '${row}',\n`;
    });
    code += '];\n\n';
    
    // Adicionar o código de cores
    code += '// Mapeamento de cores\n';
    code += 'const colorMap = {\n';
    for (const [key, value] of Object.entries(colorMap)) {
        code += `    '${key}': '${value}', // ${getColorDescription(key)}\n`;
    }
    code += '};\n';
    
    return code;
}

// Descrições de cores para o comentário
function getColorDescription(key) {
    const descriptions = {
        '.': 'Transparente',
        'B': 'Cabelo',
        'S': 'Pele',
        'E': 'Olhos',
        'A': 'Camisa',
        'P': 'Calças',
        'M': 'Sapatos'
    };
    return descriptions[key] || 'Cor personalizada';
}

// Exportar funções
module.exports = {
    bob,
    colorMap,
    renderCharacter,
    exportCharacterCode
};
