const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3003;

async function criarTabela() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100)
    )
  `);

  console.log("Tabela de clientes pronta");
}

app.get("/cliente", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT * FROM clientes ORDER BY id"
    );

    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar clientes"
    });
  }
});

app.get("/cliente/:id", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT * FROM clientes WHERE id = $1",
      [req.params.id]
    );

    const cliente = resultado.rows[0];

    if (!cliente) {
      return res.status(404).json({
        erro: "Cliente não encontrado"
      });
    }

    res.json(cliente);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar cliente"
    });
  }
});

app.post("/cliente", async (req, res) => {
  const { nome, email } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: "Nome é obrigatório"
    });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO clientes (nome, email)
       VALUES ($1, $2)
       RETURNING *`,
      [nome, email || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao criar cliente"
    });
  }
});

async function iniciar() {
  try {
    await criarTabela();
    app.listen(PORT, () => {
      console.log(`Clientes rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error("Erro ao inicializar o serviço de clientes:", erro);
    process.exit(1);
  }
}

iniciar();