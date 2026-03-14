Module.register("MMM-Claude", {

  defaults: {
    apiKey: "",
    model: "claude-opus-4-5",
    maxTokens: 1024,
    systemPrompt: "Du bist Claude, ein hilfreicher KI-Assistent auf einem MagicMirror. Antworte präzise und freundlich. Halte Antworten kurz und klar.",
    placeholder: "Tippe hier...",
    title: "Claude AI",
    fontSize: "16px",
  },

  history: [],
  currentInput: "",

  start() {
    Log.info("MMM-Claude: Modul gestartet");
  },

  getStyles() {
    return ["MMM-Claude.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-claude-wrapper";
    wrapper.style.fontSize = this.config.fontSize;

    // Header
    const header = document.createElement("div");
    header.className = "mmm-claude-header";
    header.innerHTML = `<span class="mmm-claude-icon">✦</span> ${this.config.title}`;
    wrapper.appendChild(header);

    // Chat-Verlauf
    const chat = document.createElement("div");
    chat.id = "mmm-claude-chat";
    chat.className = "mmm-claude-chat";
    this.history.forEach(msg => {
      chat.appendChild(this.buildBubble(msg.role, msg.content));
    });
    wrapper.appendChild(chat);

    // Typing-Indikator
    const typing = document.createElement("div");
    typing.id = "mmm-claude-typing";
    typing.className = "mmm-claude-typing hidden";
    typing.innerHTML = "<span></span><span></span><span></span>";
    wrapper.appendChild(typing);

    // Input-Bereich
    const inputRow = document.createElement("div");
    inputRow.className = "mmm-claude-input-row";

    // Input-Display — kein echtes textarea, MMM-Keyboard übernimmt Eingabe
    const inputDisplay = document.createElement("div");
    inputDisplay.id = "mmm-claude-input";
    inputDisplay.className = "mmm-claude-input";
    inputDisplay.setAttribute("role", "textbox");
    inputDisplay.setAttribute("tabindex", "0");
    this.renderInputDisplay(inputDisplay);

    // Keyboard öffnen bei Touch/Click auf das Eingabefeld
    inputDisplay.addEventListener("click", () => {
      this.sendNotification("SHOW_KEYBOARD", {
        key:   "MMM-Claude",
        style: "default",
        data:  {},
      });
      inputDisplay.classList.add("mmm-claude-input--active");
    });

    const sendBtn = document.createElement("button");
    sendBtn.id = "mmm-claude-send";
    sendBtn.className = "mmm-claude-btn mmm-claude-send";
    sendBtn.innerHTML = "➤";
    sendBtn.title = "Senden";
    sendBtn.addEventListener("click", () => this.submitInput());

    const clearBtn = document.createElement("button");
    clearBtn.className = "mmm-claude-btn mmm-claude-clear";
    clearBtn.innerHTML = "✕";
    clearBtn.title = "Verlauf löschen";
    clearBtn.addEventListener("click", () => this.clearHistory());

    inputRow.appendChild(inputDisplay);
    inputRow.appendChild(sendBtn);
    inputRow.appendChild(clearBtn);
    wrapper.appendChild(inputRow);

    return wrapper;
  },

  // Rendert den aktuellen Input-Text inkl. Placeholder
  renderInputDisplay(el) {
    if (!el) el = document.getElementById("mmm-claude-input");
    if (!el) return;
    if (this.currentInput === "") {
      el.innerHTML = `<span class="mmm-claude-placeholder">${this.config.placeholder}</span>`;
    } else {
      el.textContent = this.currentInput;
    }
  },

  // Notifications von MMM-Keyboard empfangen
  notificationReceived(notification, payload, sender) {
    if (notification === "KEYBOARD_INPUT") {
      // MMM-Keyboard schickt payload: { key: "MMM-Claude", message: "der Text", data: {} }
      // Nur für dieses Modul verarbeiten
      if (!payload || payload.key !== "MMM-Claude") return;

      // Eingabefeld als aktiv markieren
      const inputDisplay = document.getElementById("mmm-claude-input");
      if (inputDisplay) inputDisplay.classList.remove("mmm-claude-input--active");

      // message enthält den vollständigen getippten Text
      this.currentInput = payload.message || "";
      this.submitInput();
    }
  },

  submitInput() {
    const text = this.currentInput.trim();
    if (!text) return;

    // MMM-Keyboard schliesst sich nach SEND selbst — kein HIDE_KEYBOARD nötig
    this.currentInput = "";
    this.renderInputDisplay();

    this.history.push({ role: "user", content: text });
    this.appendBubble("user", text);
    this.showTyping(true);

    const btn = document.getElementById("mmm-claude-send");
    if (btn) {
      btn.disabled = true;
      btn.classList.add("mmm-claude-send--loading");
    }

    this.sendSocketNotification("CLAUDE_SEND", {
      apiKey: this.config.apiKey,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      systemPrompt: this.config.systemPrompt,
      messages: this.history.map(m => ({ role: m.role, content: m.content })),
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CLAUDE_RESPONSE") {
      this.showTyping(false);
      this.history.push({ role: "assistant", content: payload.text });
      this.appendBubble("assistant", payload.text);
      this.resetSendButton();
    } else if (notification === "CLAUDE_ERROR") {
      this.showTyping(false);
      this.appendBubble("assistant", "⚠️ Fehler: " + payload.error);
      this.resetSendButton();
    }
  },

  resetSendButton() {
    const btn = document.getElementById("mmm-claude-send");
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("mmm-claude-send--loading");
    }
  },

  buildBubble(role, content) {
    const bubble = document.createElement("div");
    bubble.className = `mmm-claude-bubble mmm-claude-bubble--${role}`;

    const label = document.createElement("span");
    label.className = "mmm-claude-label";
    label.textContent = role === "user" ? "Du" : "Claude";

    const text = document.createElement("div");
    text.className = "mmm-claude-text";
    text.textContent = content;

    bubble.appendChild(label);
    bubble.appendChild(text);
    return bubble;
  },

  appendBubble(role, content) {
    const chat = document.getElementById("mmm-claude-chat");
    if (!chat) return;
    chat.appendChild(this.buildBubble(role, content));
    chat.scrollTop = chat.scrollHeight;
  },

  showTyping(show) {
    const el = document.getElementById("mmm-claude-typing");
    if (!el) return;
    el.classList.toggle("hidden", !show);
    if (show) {
      const chat = document.getElementById("mmm-claude-chat");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }
  },

  clearHistory() {
    this.history = [];
    const chat = document.getElementById("mmm-claude-chat");
    if (chat) chat.innerHTML = "";
  },
});
