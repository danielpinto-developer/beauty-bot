const { PythonShell } = require("python-shell");
const path = require("path");

function classifyIntent(messageText) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: "json",
      pythonOptions: ["-u"],
      scriptPath: path.join(__dirname, "../bert_intent_classifier"),
      args: [messageText],
    };

    PythonShell.run("predict.py", options, (err, results) => {
      if (err) return reject(err);
      if (!results || !results.length) return reject("No result from BERT");

      const result = results[0];
      if (!result.intent || result.confidence === undefined) {
        return reject("Invalid response from predict.py");
      }

      resolve({
        intent: result.intent,
        confidence: result.confidence,
        probabilities: result.probabilities || {},
      });
    });
  });
}

module.exports = { classifyIntent };
