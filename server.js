const express = require('express');
const routes = require('./src/routes/routes');

const app = express();
app.use(express.json());

app.use('/', routes); // Agora todas as rotas estão centralizadas

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
