const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./casamento.db', (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
        // Criar a tabela de cadeiras se não existir
        db.run(`CREATE TABLE IF NOT EXISTS cadeiras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mesa TEXT NOT NULL,
            numero INTEGER NOT NULL,
            ocupado INTEGER DEFAULT 0,
            convidado TEXT DEFAULT NULL,
            UNIQUE(mesa, numero)
        )`);
        // Inicializar algumas cadeiras se o banco de dados estiver vazio (apenas para teste inicial)
        // Você pode remover isso depois de popular o DB
        db.get("SELECT count(*) AS total FROM cadeiras", (err, row) => { // Mudança aqui: AS total
            if (err) { // Adiciona a verificação de erro
                console.error("Erro ao verificar o número de cadeiras:", err.message);
                return; // Importante: sair da função se houver erro
            }
            // Acessa a propriedade 'total' que definimos com AS
            if (row.total === 0) {
                console.log("Preenchendo cadeiras iniciais...");
                for (let i = 1; i <= 11; i++) { // 11 mesas
                    const mesaLetra = String.fromCharCode(64 + i); // A, B, C...
                    for (let j = 1; j <= 8; j++) { // 8 cadeiras por mesa
                        db.run(`INSERT INTO cadeiras (mesa, numero) VALUES (?, ?)`, [mesaLetra, j], (insertErr) => {
                            if (insertErr) {
                                console.error(`Erro ao inserir cadeira ${mesaLetra}${j}:`, insertErr.message);
                            }
                        });
                    }
                }
            }
        });
    }
});

// Middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Para parsear JSON no corpo das requisições

// --- Rotas da API ---

// Rota para obter todas as cadeiras
app.get('/api/cadeiras', (req, res) => {
    db.all("SELECT * FROM cadeiras", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ cadeiras: rows });
    });
});

// Rota para reservar uma cadeira
app.post('/api/reservar', (req, res) => {
    const { id, convidado } = req.body;
    db.run(`UPDATE cadeiras SET ocupado = 1, convidado = ? WHERE id = ? AND ocupado = 0`,
        [convidado, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(400).json({ message: "Cadeira já ocupada ou não encontrada." });
            } else {
                res.json({ message: "Cadeira reservada com sucesso!", changes: this.changes });
            }
        });
});

// --- Rotas de Administrador (Básicas - SEM AUTENTICAÇÃO SEGURA AINDA!) ---
// Para um projeto real, você precisaria de um sistema de autenticação mais robusto (ex: JWT)

// Rota para liberar uma cadeira (admin)
app.post('/api/admin/liberar', (req, res) => {
    // Em um sistema real, você verificaria o login do administrador aqui
    const { id } = req.body;
    db.run(`UPDATE cadeiras SET ocupado = 0, convidado = NULL WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(400).json({ message: "Cadeira não encontrada." });
            } else {
                res.json({ message: "Cadeira liberada com sucesso!", changes: this.changes });
            }
        });
});

// Rota para adicionar uma reserva (admin)
app.post('/api/admin/adicionar', (req, res) => {
    // Em um sistema real, você verificaria o login do administrador aqui
    const { mesa, numero, convidado } = req.body;
    db.run(`UPDATE cadeiras SET ocupado = 1, convidado = ? WHERE mesa = ? AND numero = ? AND ocupado = 0`,
        [convidado, mesa, numero],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(400).json({ message: "Cadeira já ocupada ou não encontrada." });
            } else {
                res.json({ message: "Reserva adicionada com sucesso!", changes: this.changes });
            }
        });
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});