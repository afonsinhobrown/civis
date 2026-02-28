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
// 1. Apontar para os arquivos estáticos gerados pelo build do React
const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

// 2. Rota curinga para o React (SPA) lidar com o roteamento interno
app.get('*', (req, res) => {
    // Se a rota não for /api, devolve o index.html do React
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
});
