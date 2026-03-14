const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({

  start() {
    console.log("[MMM-Claude] node_helper gestartet");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CLAUDE_SEND") {
      this.callClaude(payload);
    }
  },

  callClaude(payload) {
    const { apiKey, model, maxTokens, systemPrompt, messages } = payload;

    const body = JSON.stringify({
      model: model || "claude-opus-4-5",
      max_tokens: maxTokens || 1024,
      system: systemPrompt,
      messages: messages,
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.error("[MMM-Claude] API Fehler:", parsed.error.message);
            this.sendSocketNotification("CLAUDE_ERROR", { error: parsed.error.message });
            return;
          }
          const text = parsed.content?.[0]?.text || "(Leere Antwort)";
          this.sendSocketNotification("CLAUDE_RESPONSE", { text });
        } catch (e) {
          console.error("[MMM-Claude] Parse Fehler:", e.message);
          this.sendSocketNotification("CLAUDE_ERROR", { error: "Parse-Fehler: " + e.message });
        }
      });
    });

    req.on("error", (e) => {
      console.error("[MMM-Claude] Request Fehler:", e.message);
      this.sendSocketNotification("CLAUDE_ERROR", { error: "Netzwerkfehler: " + e.message });
    });

    req.write(body);
    req.end();
  },
});
