const express = require("express");
const axios = require("axios");
const db = require("./db");

const app = express();

app.use(express.json());

const PRODUTOS_URL = process.env.PRODUTOS_URL || "http://localhost:3001";
const CLIENTES_URL = process.env.CLIENTES_URL || "http://localhost:3003";
const PORT = process.env.PORT || 3002;

async function criarTabela() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      cliente_id INT NOT NULL,
      produto_id INT NOT NULL,
      quantidade INT NOT NULL
    )
  `);

  console.log("Tabela de pedidos pronta");
}

app.get("/pedido", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT * FROM pedidos ORDER BY id"
    );

    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar pedidos"
    });
  }
});

app.get("/pedido/:id", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [req.params.id]
    );

    const pedido = resultado.rows[0];

    if (!pedido) {
      return res.status(404).json({
        erro: "Pedido não encontrado"
      });
    }

    res.json(pedido);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar pedido"
    });
  }
});

app.post("/pedido", async (req, res) => {
  const clienteId = req.body.cliente_id || req.body.clienteId;
  const produtoId = req.body.produto_id || req.body.produtoId;
  const quantidade = req.body.quantidade;

  if (!clienteId || !produtoId || !quantidade || quantidade <= 0) {
    return res.status(400).json({
      erro: "cliente_id, produto_id e quantidade válida são obrigatórios"
    });
  }

  let cliente;
  try {
    const respostaCliente = await axios.get(
      `${CLIENTES_URL}/cliente/${clienteId}`,
      { timeout: 3000 }
    );
    cliente = respostaCliente.data;
  } catch (erro) {
    if (erro.response?.status === 404) {
      return res.status(400).json({
        erro: "Cliente não encontrado"
      });
    }
    return res.status(503).json({
      erro: "Serviço de Clientes indisponível"
    });
  }

  let produto;
  try {
    const respostaProduto = await axios.get(
      `${PRODUTOS_URL}/produto/${produtoId}`,
      { timeout: 3000 }
    );
    produto = respostaProduto.data;
  } catch (erro) {
    if (erro.response?.status === 404) {
      return res.status(400).json({
        erro: "Produto não encontrado"
      });
    }
    return res.status(503).json({
      erro: "Serviço de Produtos indisponível"
    });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO pedidos (cliente_id, produto_id, quantidade)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clienteId, produtoId, quantidade]
    );

    const pedidoCriado = {
      id: resultado.rows[0].id,
      produto: produto,
      cliente: clienteId,
      quantidade: quantidade
    };

    res.status(201).json(pedidoCriado);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao salvar pedido no banco de dados"
    });
  }
});

async function iniciar() {
  try {
    await criarTabela();
    app.listen(PORT, () => {
      console.log(`Pedidos rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error("Erro ao inicializar o serviço de pedidos:", erro);
    process.exit(1);
  }
}

iniciar();