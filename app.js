const express = require("express");
const path = require("path");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");

const app = express();

// Seguridad básica + CSP simple
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Motor de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Datos en memoria
let generalTasks = [];
let workTasks = [];

// Función para ordenar por importancia (prioridad ascendente)
function sortByImportance(list) {
  list.sort((a, b) => a.priority - b.priority);
}

// Función para ordenar por fecha de entrega
// Las tareas sin fecha van al final
function sortByDeadline(list) {
  list.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;   // a sin fecha -> después
    if (!b.deadline) return -1;  // b sin fecha -> después

    const da = new Date(a.deadline);
    const db = new Date(b.deadline);
    return da - db;
  });
}

// Ruta principal
app.get("/", (req, res) => {
  const sortBy = req.query.sortBy; // "importance" o "deadline"

  const generalCopy = [...generalTasks];
  const workCopy = [...workTasks];

  if (sortBy === "importance") {
    sortByImportance(generalCopy);
    sortByImportance(workCopy);
  } else if (sortBy === "deadline") {
    sortByDeadline(generalCopy);
    sortByDeadline(workCopy);
  }

  res.render("index", {
    generalTasks: generalCopy,
    workTasks: workCopy,
    sortBy: sortBy || ""
  });
});

// Crear tarea (fecha NO obligatoria)
app.post(
  "/add",
  [
    body("title").trim().escape(),
    body("description").trim().escape(),
    body("list").trim().isIn(["general", "work"]),
    body("deadline").optional({ checkFalsy: true }).trim().escape(),
    body("estimatedDuration").optional({ checkFalsy: true }).toInt(),
    body("priority").toInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send("Datos inválidos");
    }

    let {
      title,
      description,
      list,
      deadline,
      estimatedDuration,
      priority
    } = req.body;

    if (!deadline) {
      deadline = null; // sin fecha
    }

    if (!estimatedDuration || estimatedDuration < 0) {
      estimatedDuration = null; // solo informativo
    }

    const newTask = {
      id: Date.now(),
      title,
      description,
      list,
      deadline,
      estimatedDuration,
      priority
    };

    if (list === "general") {
      generalTasks.push(newTask);
    } else {
      workTasks.push(newTask);
    }

    res.redirect("/?sortBy=" + (req.query.sortBy || ""));
  }
);

// Eliminar tarea
app.post("/delete", (req, res) => {
  const id = parseInt(req.body.id, 10);
  const list = req.body.list;

  if (list === "general") {
    generalTasks = generalTasks.filter((t) => t.id !== id);
  } else {
    workTasks = workTasks.filter((t) => t.id !== id);
  }

  res.redirect("/?sortBy=" + (req.query.sortBy || ""));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en el puerto", PORT);
});

module.exports = app;