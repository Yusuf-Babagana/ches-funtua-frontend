const fs = require('fs');
const path = require('path');

function searchInFile(filePath, patterns) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            patterns.forEach(pattern => {
                if (line.includes(pattern)) {
                    console.log(`📁 ${filePath}:${index + 1}`);
                    console.log(`   ${line.trim()}`);
                    console.log('---');
                }
            });
        });
    } catch (error) {
        // Skip files that can't be read
    }
}

function searchDirectory(dir, patterns) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('.next')) {
            searchDirectory(fullPath, patterns);
        } else if (file.isFile() && /\.(tsx|ts|jsx|js)$/.test(file.name)) {
            searchInFile(fullPath, patterns);
        }
    });
}

const patterns = [
    'handleSubmitDirect',
    'errorData.detail',
    'await response.json()',
    'Login failed'
];

console.log('🔍 Searching for the problematic code...');
searchDirectory('.', patterns);