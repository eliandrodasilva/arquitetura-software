const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const PRODUTOS_URL = process.env.PRODUTOS_URL || "http://produto:3001";
const PEDIDOS_URL = process.env.PEDIDOS_URL || "http://pedido:3002";
const CLIENTES_URL = process.env.CLIENTES_URL || "http://cliente:3003";

// Repassa qualquer requisição usando Axios nativo
async function repassar(req, res, targetUrl) {
  try {
    const resposta = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      timeout: 5000,
      validateStatus: () => true
    });

    res.status(resposta.status).json(resposta.data);
  } catch (erro) {
    res.status(503).json({
      erro: "Serviço de destino indisponível"
    });
  }
}

// Rotas de Produto (apenas singular)
app.all(["/produto", "/produto/:id"], (req, res) => {
  repassar(req, res, `${PRODUTOS_URL}${req.originalUrl}`);
});

// Rotas de Pedido (apenas singular)
app.all(["/pedido", "/pedido/:id"], (req, res) => {
  repassar(req, res, `${PEDIDOS_URL}${req.originalUrl}`);
});

// Rotas de Cliente (apenas singular)
app.all(["/cliente", "/cliente/:id"], (req, res) => {
  repassar(req, res, `${CLIENTES_URL}${req.originalUrl}`);
});

app.get("/", (req, res) => {
  res.json({
    servico: "API Gateway",
    status: "online",
    rotas: ["/produto", "/pedido", "/cliente"]
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway rodando na porta ${PORT}`);
});
