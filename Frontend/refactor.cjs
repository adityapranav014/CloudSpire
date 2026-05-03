const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
['Accounts.jsx', 'Anomalies.jsx', 'CostExplorer.jsx', 'Optimizer.jsx', 'Reports.jsx', 'Settings.jsx', 'Teams.jsx'].forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // Find all mock imports
    const mockImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/data\/mock([^'"]+)['"]/g;
    let match;
    const dependencies = [];
    
    while ((match = mockImportRe.exec(content)) !== null) {
        const namedExports = match[1].split(',').map(s => s.trim());
        const sourceName = match[2];
        dependencies.push({ exports: namedExports, source: sourceName });
    }
    
    if (dependencies.length > 0) {
        hasChanges = true;
        // Remove all mock imports
        content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]\.\.\/data\/mock[^'"]+['"];?/g, '');
        
        // Add SWR hook import
        if (!content.includes('useMigrationData')) {
            content = "import { useMigrationData } from '../hooks/useMigrationData';\n" + content;
        }
        
        // Inject the hooks at the start of the default export function
        const componentName = file.replace('.jsx', '');
        const exportRe = new RegExp(`export\\s+default\\s+function\\s+${componentName}\\s*\\([^)]*\\)\\s*\\{`);
        
        let hooksInjection = '\n';
        const isLoadings = [];
        
        dependencies.forEach((dep, index) => {
            const endpoint = dep.source === 'AWS' ? '/cloud/aws' :
                             dep.source === 'GCP' ? '/cloud/gcp' :
                             dep.source === 'Azure' ? '/cloud/azure' :
                             dep.source === 'Unified' ? '/unified' :
                             dep.source === 'Alerts' ? '/alerts' :
                             dep.source === 'Roles' ? '/roles' :
                             dep.source === 'Teams' ? '/teams' :
                             dep.source === 'Users' ? '/users' :
                             dep.source === 'Optimizations' ? '/optimizations' : '';
            
            hooksInjection += `  const { data: d${index}, isLoading: l${index} } = useMigrationData('${endpoint}');\n`;
            hooksInjection += `  const { ${dep.exports.join(', ')} } = d${index} || {};\n`;
            isLoadings.push(`l${index}`);
        });
        
        hooksInjection += `\n  const isLoading = ${isLoadings.join(' || ')};\n  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;\n`;
        
        content = content.replace(exportRe, `export default function ${componentName}() {${hooksInjection}`);
        
        fs.writeFileSync(filePath, content);
        console.log('Migrated', file);
    }
});
console.log('Refactoring complete');