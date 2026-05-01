const fs = require('fs');
const path = require('path');

const componentFiles = [
    'src/components/charts/AreaSpendChart.jsx',
    'src/components/charts/ForecastChart.jsx',
    'src/components/layout/Sidebar.jsx',
    'src/components/layout/TopBar.jsx',
    'src/components/ui/AccessDenied.jsx',
    'src/components/ui/DemoRoleSwitcher.jsx'
];

componentFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Find missing variables from removed imports
    const mockImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/.*\/?data\/mock([^'"]+)['"]/g;
    let match;
    const dependencies = [];

    while ((match = mockImportRe.exec(content)) !== null) {
        dependencies.push(...match[1].split(',').map(s => s.trim()));
    }

    if (dependencies.length > 0) {
        content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]\.\.\/.*\/?data\/mock[^'"]+['"];?/g, '');

        // Define empty defaults for them at the top level
        let dummyExports = '\n// Fallbacks due to migration\n';
        dependencies.forEach(d => {
            dummyExports += `const ${d} = []; // Migrated to backend\n`;
        });

        content = content.replace(/import React/, "import React\n" + dummyExports);
        if (!content.includes('import React')) {
            content = dummyExports + content;
        }

        fs.writeFileSync(filePath, content);
        console.log('Removed mock imports from', file);
    }
});