const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// SERVIR FRONTEND CENTRALIZADO (Monólito)
const fs = require('fs');
const frontendPath = path.resolve(__dirname, '..', 'frontend', 'build');

console.log('--- Verificação de Deploy ---');
console.log('Buscando Frontend em:', frontendPath);
if (fs.existsSync(frontendPath)) {
    console.log('Diretório do frontend encontrado ✅');
    app.use(express.static(frontendPath));
} else {
    console.warn('Diretório do frontend NÃO encontrado ❌ (Verifique o build no Render)');
}

// 2. Rota curinga para o React (SPA) lidar com o roteamento interno
app.get('*', (req, res) => {
    // Se a rota não for /api, devolve o index.html do React
    if (!req.path.startsWith('/api')) {
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).json({
                error: "Página não encontrada",
                message: "O frontend não foi compilado ou index.html não existe.",
                path_attempted: indexPath
            });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
});
