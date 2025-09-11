class Dashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.intervalId = null;
    this.timer = null;
  }

  connectedCallback() {
    this.userId = localStorage.getItem("user");

    Promise.all([
      fetch(`/auction`).then(res => res.json()),
      fetch(`/users/${this.userId}`).then(res => res.json())
    ])
    .then(([auction, user]) => {
      this.auction = auction;
      console.log(this.auction)
      this.user = user;
      this.render();
      this.startCountdown();
      this.startRefreshingItems();
    })
    .catch(err => console.error("Error loading data:", err));
  }

  disconnectedCallback() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.timer) clearInterval(this.timer);
  }
  renderResults() {
    if(!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
    <link rel="stylesheet" href="./styles.css">
    <button id="logout">Logout</button>

    <h1>Hello, ${this.user?.name || "Guest"}</h1> 
    <img src="wizard.png" alt="" height="200px">
    <h1>Your new items</h1>
    <div id="won-bids">
    </div>

    <h1>Auction Results</h1>

    <div id="sold-list">
    
    </div>
    `
    const wonBids = this.shadowRoot.getElementById("won-bids");
    const soldList = this.shadowRoot.getElementById("sold-list");


    fetch("/items/?sort=highestBid")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();  
    }).then(items => {
      items.forEach(item => {
        const soldCard = document.createElement("sold-card");
        soldCard.setAttribute("item", JSON.stringify(item));
        soldList.appendChild(soldCard);
      });
    });


fetch(`/items/${this.userId}/items`)
  .then((res) => {
    if (!res.ok) throw new Error("Failed to fetch user items");
    return res.json();
  })
  .then((items) => {
    console.log("Fetched items for user:", items);
    if (!Array.isArray(items)) {
      throw new Error("Expected an array, got: " + JSON.stringify(items));
    }


    if (items.length === 0) {
      wonBids.innerHTML = `<h1>You didn't win any bids :(</h1>`;
      return;
    }

    items.forEach((item) => {
      const buyCard = document.createElement("buy-card");
      buyCard.setAttribute("item", JSON.stringify(item));
      wonBids.appendChild(buyCard);
    });
  })
  .catch((err) => console.error("Error loading user items:", err));

  
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./styles.css">
      <button id="logout">Logout</button>
      <h1 id="time">${this.auction?.endTime ? "" : "Auction closed"}</h1>
      <h1>Hello, ${this.user?.name || "Guest"}</h1> 
      <img src="wizard.png" alt="" height="200px">
      <p>Your balance is: <strong>$${this.user?.balance ?? 0}</strong></p>
      <h2>Items for Auction</h2>
      <div id="items-list"></div>
    `;
  }

  startCountdown() {
    if (!this.auction?.endTime) return;

    clearInterval(this.timer);
    const endTime = new Date(this.auction.endTime).getTime();

    const update = () => {
      const countdownEl = this.shadowRoot.getElementById("time");
      if (!countdownEl) return;

      const now = Date.now();
      const timeLeft = endTime - now;

      if (timeLeft <= 0) {
        countdownEl.textContent = "Auction closed";
        clearInterval(this.timer);
        this.renderResults();
      }

      const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    update();
    this.timer = setInterval(update, 1000);
  }


startRefreshingItems() {
  const loadData = () => {
    fetch("/auction")
      .then(res => res.json())
      .then(auction => {
        this.auction = auction;
        if (auction.isOpen && auction.endTime) {
          this.startCountdown();
        } else {
          const countdownEl = this.shadowRoot.getElementById("time");
          if (countdownEl) countdownEl.textContent = "Auction closed";
        }
      })
      .catch(err => console.error("Error loading auction:", err));

    fetch("/items?sort=highestBid")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch items");
        return res.json();
      })
      .then(items => {
        const itemsList = this.shadowRoot.getElementById("items-list");
        if (!itemsList) return;
        itemsList.innerHTML = "";
        items.forEach(item => {
          const itemCard = document.createElement("item-card");
          itemCard.setAttribute("item", JSON.stringify(item));
          itemsList.appendChild(itemCard);
        });
      })
      .catch(err => console.error("Error loading items:", err));
  };

  loadData();
  this.intervalId = setInterval(loadData, 1000); // refresh both every second

  const logoutBtn = this.shadowRoot.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "/start";
    });
  }
}

}

customElements.define("dashboard-page", Dashboard);