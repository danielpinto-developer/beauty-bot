const { PythonShell } = require("python-shell");
const path = require("path");

function extractSlots(messageText) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: "json",
      pythonOptions: ["-u"],
      scriptPath: path.join(__dirname, "spacy_ner_training"),
      args: [messageText],
    };

    PythonShell.run("predict.py", options, (err, results) => {
      if (err) return reject(err);
      if (!results || !results.length)
        return reject("No result from spaCy slot filler");

      const result = results[0];
      resolve({
        fecha: result.fecha || null,
        hora: result.hora || null,
        servicio: result.servicio || null,
      });
    });
  });
}

module.exports = { extractSlots };
