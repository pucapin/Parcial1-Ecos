class Dashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    fetch(`/auction`)
    .then(res => res.json())
    .then(data => { 
      this.auction = data;
      this.render();
      this.startCountdown();
    }
    );
  }

  
  startCountdown() {
    if (!this.auction?.endTime) return;

    clearInterval(this.timer);

    const countdownEl = this.shadowRoot.getElementById("time");
    const endTime = new Date(this.auction.endTime).getTime();

    const update = () => {
      const now = Date.now();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        countdownEl.textContent = "Auction closed";
        clearInterval(this.timer);
        fetch(`/auction/closeAll`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
          this.auction = data;
          this.shadowRoot.innerHTML = ''
          this.renderResults();
        });
        return;
      }

      const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      countdownEl.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

    update(); // run immediately
    this.timer = setInterval(update, 1000);
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./styles.css">

        <h1 id="time">${this.auction.endTime ? "" : "Auction closed"}</h1>
        <h1>Hello, Admin</h1> <img src="wizard.png" alt="" height="200px">
        <button id="start-auction" ${this.auction?.isOpen ? "disabled" : ""}>
      ${this.auction?.isOpen ? "Auction Running..." : "Start Auction"}
    </button>
        <h2>Items for Auction</h2>
        <div id="items-list"></div>
        `;
    fetch("/items/?sort=highestBid")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();  
    }).then(items => {
      const itemsList = this.shadowRoot.getElementById("items-list");
      items.forEach(item => {
        const itemCard = document.createElement("item-card");
        itemCard.setAttribute("item", JSON.stringify(item));
        itemsList.appendChild(itemCard);
      });
    });
    const startButton = this.shadowRoot.getElementById("start-auction");
    if (startButton && !this.auction?.isOpen) {
      startButton.addEventListener("click", () => {
        fetch("/auction/openAll", { method: "POST" })
          .then(res => res.json())
          .then(data => {
            this.auction = data;
            this.render();
            this.startCountdown();
          });
      });
    }
  }
  renderResults() {
    if(!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
    <link rel="stylesheet" href="./styles.css">

    <h1>Hello, Admin</h1> <img src="wizard.png" alt="" height="200px">
    <button id="reset-auction">Reset Auction</button>
    <h1>Auction Results</h1>
    <div id="sold-list">
    
    </div>
    `
    fetch("/items/?sort=highestBid")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();  
    }).then(items => {
      const soldList = this.shadowRoot.getElementById("sold-list");
      items.forEach(item => {
        const soldCard = document.createElement("sold-card");
        soldCard.setAttribute("item", JSON.stringify(item));
        soldList.appendChild(soldCard);
      });
    });
    const resetAuction = this.shadowRoot.getElementById('reset-auction');
    resetAuction.addEventListener('click', () => {
      this.shadowRoot.innerHTML = '';
      this.render();
    })

  }

}

customElements.define("dashboard-page", Dashboard);
