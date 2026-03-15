Module.register("MMM-Claude", {

  defaults: {
    apiKey: "",
    model: "claude-opus-4-5",
    maxTokens: 1024,
    systemPrompt: "Du bist Claude, ein hilfreicher KI-Assistent auf einem MagicMirror. Antworte präzise und freundlich. Halte Antworten kurz und klar.",
    placeholder: "Tippe hier...",
    title: "Claude AI",
    fontSize: "16px",
    enableWebSearch: false,   // true = Websuche aktivieren (kostet mehr Tokens)
  },

  // ── State ──────────────────────────────────────────────
  history:      [],
  currentInput: "",
  kbVisible:    false,
  shift:        false,
  numMode:      false,

  // ── Keyboard layouts ───────────────────────────────────
  KEYS_ALPHA: [
    ["q","w","e","r","t","z","u","i","o","p","⌫"],
    ["a","s","d","f","g","h","j","k","l","ä","↵"],
    ["⇧","y","x","c","v","b","n","m","ö","ü","⇧"],
    ["123","  ",".",],
  ],
  KEYS_NUM: [
    ["1","2","3","4","5","6","7","8","9","0","⌫"],
    ["-","/",":",";","(",")","@","&","=","'","↵"],
    ["#⌂",".","_","!","?",",","+","*","\"","€","#⌂"],
    ["ABC","  ",",",],
  ],

  start() {
    Log.info("MMM-Claude: gestartet");
  },

  getStyles() {
    return ["MMM-Claude.css"];
  },

  // ── DOM ────────────────────────────────────────────────
  getDom() {
    const wrap = document.createElement("div");
    wrap.className = "mmc-wrap";
    wrap.style.fontSize = this.config.fontSize;

    wrap.appendChild(this._buildHeader());
    wrap.appendChild(this._buildChat());
    wrap.appendChild(this._buildTyping());
    wrap.appendChild(this._buildInputRow());
    wrap.appendChild(this._buildKeyboard());

    return wrap;
  },

  _buildHeader() {
    const h = document.createElement("div");
    h.className = "mmc-header";
    h.innerHTML = `<span class="mmc-icon">✦</span>${this.config.title}`;
    return h;
  },

  _buildChat() {
    const c = document.createElement("div");
    c.id = "mmc-chat";
    c.className = "mmc-chat";
    this.history.forEach(m => c.appendChild(this._bubble(m.role, m.content)));
    return c;
  },

  _buildTyping() {
    const t = document.createElement("div");
    t.id = "mmc-typing";
    t.className = "mmc-typing hidden";
    t.innerHTML = "<span></span><span></span><span></span>";
    return t;
  },

  _buildInputRow() {
    const row = document.createElement("div");
    row.className = "mmc-input-row";

    const field = document.createElement("div");
    field.id = "mmc-field";
    field.className = "mmc-field";
    field.setAttribute("role", "textbox");
    this._renderField(field);
    field.addEventListener("click", () => this._toggleKb(true));

    const sendBtn = document.createElement("button");
    sendBtn.id = "mmc-send";
    sendBtn.className = "mmc-btn mmc-btn-send";
    sendBtn.innerHTML = "➤";
    sendBtn.addEventListener("click", () => this._submit());

    const clearBtn = document.createElement("button");
    clearBtn.className = "mmc-btn mmc-btn-clear";
    clearBtn.innerHTML = "✕";
    clearBtn.title = "Verlauf löschen";
    clearBtn.addEventListener("click", () => this._clearHistory());

    row.appendChild(field);
    row.appendChild(sendBtn);
    row.appendChild(clearBtn);
    return row;
  },

  _buildKeyboard() {
    const kb = document.createElement("div");
    kb.id = "mmc-kb";
    kb.className = "mmc-kb" + (this.kbVisible ? "" : " mmc-kb-hidden");
    this._renderKeys(kb);
    return kb;
  },

  // ── Keyboard rendering ─────────────────────────────────
  _renderKeys(kb) {
    if (!kb) kb = document.getElementById("mmc-kb");
    if (!kb) return;
    kb.innerHTML = "";

    const layout = this.numMode ? this.KEYS_NUM : this.KEYS_ALPHA;

    layout.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "mmc-kb-row";

      row.forEach(key => {
        const btn = document.createElement("button");
        btn.className = "mmc-key";

        // Display label
        let label = key;
        if (key === "  ") { label = "Leertaste"; btn.classList.add("mmc-key-space"); }
        else if (key === "⌫") btn.classList.add("mmc-key-wide");
        else if (key === "↵") { label = "↵ Senden"; btn.classList.add("mmc-key-enter"); }
        else if (key === "⇧") { btn.classList.add("mmc-key-wide"); if (this.shift) btn.classList.add("mmc-key-active"); }
        else if (key === "123" || key === "ABC" || key === "#⌂") btn.classList.add("mmc-key-wide");
        else if (!this.numMode && this.shift && key.length === 1) label = key.toUpperCase();

        btn.textContent = label;
        btn.addEventListener("click", (e) => { e.stopPropagation(); this._onKey(key); });
        rowEl.appendChild(btn);
      });

      kb.appendChild(rowEl);
    });
  },

  // ── Key handler ────────────────────────────────────────
  _onKey(key) {
    if (key === "⌫") {
      this.currentInput = this.currentInput.slice(0, -1);
    } else if (key === "↵") {
      this._submit();
      return;
    } else if (key === "⇧") {
      this.shift = !this.shift;
      this._renderKeys();
      this._renderField();
      return;
    } else if (key === "123") {
      this.numMode = true;
      this._renderKeys();
      return;
    } else if (key === "ABC" || key === "#⌂") {
      this.numMode = false;
      this.shift = false;
      this._renderKeys();
      return;
    } else if (key === "  ") {
      this.currentInput += " ";
    } else {
      const ch = (!this.numMode && this.shift) ? key.toUpperCase() : key;
      this.currentInput += ch;
      if (this.shift) {
        this.shift = false;
        this._renderKeys();
      }
    }
    this._renderField();
  },

  // ── Field rendering ────────────────────────────────────
  _renderField(el) {
    if (!el) el = document.getElementById("mmc-field");
    if (!el) return;
    if (this.currentInput === "") {
      el.innerHTML = `<span class="mmc-placeholder">${this.config.placeholder}</span>`;
    } else {
      // Text + blinkender Cursor
      el.innerHTML = `<span class="mmc-input-text">${this._esc(this.currentInput)}</span><span class="mmc-cursor">|</span>`;
    }
  },

  _esc(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  },

  // ── Keyboard toggle ────────────────────────────────────
  _toggleKb(show) {
    this.kbVisible = show;
    const kb = document.getElementById("mmc-kb");
    const field = document.getElementById("mmc-field");
    if (kb) kb.classList.toggle("mmc-kb-hidden", !show);
    if (field) field.classList.toggle("mmc-field-active", show);
  },

  // ── Submit ─────────────────────────────────────────────
  _submit() {
    const text = this.currentInput.trim();
    if (!text) return;

    this._toggleKb(false);
    this.currentInput = "";
    this._renderField();

    this.history.push({ role: "user", content: text });
    this._appendBubble("user", text);
    this._showTyping(true);

    const btn = document.getElementById("mmc-send");
    if (btn) { btn.disabled = true; btn.classList.add("mmc-btn-loading"); }

    this.sendSocketNotification("CLAUDE_SEND", {
      apiKey:          this.config.apiKey,
      model:           this.config.model,
      maxTokens:       this.config.maxTokens,
      systemPrompt:    this.config.systemPrompt,
      messages:        this.history.map(m => ({ role: m.role, content: m.content })),
      enableWebSearch: this.config.enableWebSearch,
    });
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CLAUDE_RESPONSE") {
      this._showTyping(false);
      this.history.push({ role: "assistant", content: payload.text });
      this._appendBubble("assistant", payload.text);
      this._resetSend();
    } else if (notification === "CLAUDE_ERROR") {
      this._showTyping(false);
      this._appendBubble("assistant", "⚠️ " + payload.error);
      this._resetSend();
    }
  },

  _resetSend() {
    const btn = document.getElementById("mmc-send");
    if (btn) { btn.disabled = false; btn.classList.remove("mmc-btn-loading"); }
  },

  // ── Simple Markdown → HTML ─────────────────────────────
  _md(text) {
    return text
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
      .replace(/\n/g, "<br>");
  },

  // ── Helpers ────────────────────────────────────────────
  _bubble(role, content) {
    const b = document.createElement("div");
    b.className = `mmc-bubble mmc-bubble-${role}`;
    const lbl = document.createElement("span");
    lbl.className = "mmc-label";
    lbl.textContent = role === "user" ? "Du" : "Claude";
    const txt = document.createElement("div");
    txt.className = "mmc-text";
    if (role === "assistant") {
      txt.innerHTML = this._md(content);
    } else {
      txt.textContent = content;
    }
    b.appendChild(lbl);
    b.appendChild(txt);
    return b;
  },

  _appendBubble(role, content) {
    const chat = document.getElementById("mmc-chat");
    if (!chat) return;
    chat.appendChild(this._bubble(role, content));
    chat.scrollTop = chat.scrollHeight;
  },

  _showTyping(show) {
    const t = document.getElementById("mmc-typing");
    if (t) t.classList.toggle("hidden", !show);
    if (show) {
      const chat = document.getElementById("mmc-chat");
      if (chat) chat.scrollTop = chat.scrollHeight;
    }
  },

  _clearHistory() {
    this.history = [];
    const chat = document.getElementById("mmc-chat");
    if (chat) chat.innerHTML = "";
    this._toggleKb(false);
    this.currentInput = "";
    this._renderField();
  },
});
