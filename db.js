// db.js
const mongoose = require("mongoose");

// Cargar dotenv solo en desarrollo
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { MONGO_USER, MONGO_PASS, MONGO_CLUSTER, MONGO_DB } = process.env;

// Verificar que todas las variables estén definidas
if (!MONGO_USER || !MONGO_PASS || !MONGO_CLUSTER || !MONGO_DB) {
  console.error("❌ Falta alguna variable de entorno de MongoDB");
  process.exit(1);
}

// Construir la URI usando el formato genérico de MongoDB Atlas
const mongoURI = `mongodb+srv://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASS)}@${MONGO_CLUSTER}/${MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Conectado a MongoDB Atlas"))
.catch(err => {
  console.error("❌ Error de conexión a MongoDB Atlas:", err);
  process.exit(1);
});

module.exports = mongoose;
