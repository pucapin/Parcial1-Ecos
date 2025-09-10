class ItemDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const userId = localStorage.getItem("user");
  Promise.all([
    fetch(`/auction`).then(res => res.json()),
    fetch(`/users/${userId}`).then(res => res.json())
  ])
    .then(([auction, user]) => {
      this.auction = auction;
      this.user = user;

      const params = new URLSearchParams(window.location.search);
      this.itemId = params.get("id");

      if (!this.itemId) {
        this.shadowRoot.innerHTML = `<p>No item specified.</p>`;
        return;
      }

      this.loadItem();
    })
    .catch(err => console.error("Error loading data:", err));
  }

  async loadItem() {
    try {
      const res = await fetch(`/items/${this.itemId}`);
      if (!res.ok) throw new Error("Failed to fetch item");

      const item = await res.json();
      this.render(item);
    } catch (err) {
      console.error(err);
      this.shadowRoot.innerHTML = `<p style="color:red">Error loading item</p>`;
    }
  }


  render(item) {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./styles.css">

      <button id="go-back">Go back</button>
      <h1 id="balance">Balance: ${this.user.balance}</h1>
      <div class="item">
        <h2>${item.name}</h2>
        <p><strong>Highest Bid:</strong> $${item.highestBid ?? 0}</p>
        <p><strong>Highest Bidder:</strong> ${item.highestBidder ?? "None"}</p>
        <input type="number" id="bid-amount" placeholder="Enter your bid"/>
        <button id="bid">Place Bid</button>
        <p id="error-message"></p>
      </div>
    `;
    const bidAmountInput = this.shadowRoot.getElementById("bid-amount");
    const bidBtn = this.shadowRoot.getElementById("bid");
    const errorEl = this.shadowRoot.getElementById("error-message");
    const goBack = this.shadowRoot.getElementById('go-back');

    goBack.addEventListener('click', () => {
      window.location.href = '/player'
    });

    bidBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const bidAmount = parseFloat(bidAmountInput.value);
      fetch(`/items/${this.itemId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.user.id, amount: bidAmount })
      })
        .then(async res => {
          if (!res.ok) {
            const errorMessage = await res.text();
            errorEl.textContent = errorMessage;
            errorEl.style.color = "red";
            throw new Error(errorMessage);
          }
          return res.json();
        })
        .then(data => {
          errorEl.textContent = "Bid placed successfully!";
          errorEl.style.color = "green";
          bidAmountInput.value = ""; // reset input
          console.log("Bid success:", data);
          location.reload()
        })
        .catch(err => {
          console.error("Error placing bid:", err);
        });
    });
  }
}

customElements.define("item-detail", ItemDetail);
