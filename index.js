const express = require("express");
const path = require("path");
const db = require("./db-util");
const fs = require("fs");

const app = express();

app.use(express.json());

app.use("/start", express.static(path.join(__dirname, "start")));
app.use("/player", express.static(path.join(__dirname, "player")));
app.use("/monitor", express.static(path.join(__dirname, "monitor")));

const auctionFilePath = path.join(__dirname, "db", "auction.json");
const usersFilePath = path.join(__dirname, "db", "users.json");
const itemsFilePath = path.join(__dirname, "db", "items.json");

// funciones para leer archivos con fs :3

function readAuction() {
  const data = fs.readFileSync(auctionFilePath, "utf-8");
  return JSON.parse(data);
}
function readItems() {
  const data = fs.readFileSync(itemsFilePath, "utf-8");
  return JSON.parse(data);
}
function readUsers() {
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
}

// Registrar usuario
app.post("/users/register", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send("Name is required");
  }
  const users = readUsers();
  if (users.find((user) => user.name === name)) {
    return res.status(409).send("User already exists");
  }
  const newUser = { id: users.length + 1, name, balance: 1000, reserved: 0 };

  users.push(newUser);
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  res.status(201).send(newUser);
});
// Obtener usuario por ID
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).send("User not found");
  }
  res.json(user);
});
// Subasta Actual
app.get("/auction", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(auctionFilePath));

    if (data.auction.isOpen && new Date(data.auction.endTime) <= new Date()) {
      data.auction.isOpen = false;
      data.auction.endTime = null;
      fs.writeFileSync(auctionFilePath, JSON.stringify(data, null, 2));
    }

    res.json(data.auction);
  } catch (err) {
    res.json({ isOpen: false, endTime: null });
  }
});

// Obtener items
app.get("/items", (req, res) => {
  try {
    const sort = req.query.sort;
    let items = readItems(); // could throw error

    if (sort === "highestBid") {
      items.sort((a, b) => b.highestBid - a.highestBid);
    }

    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error when getting items" });
  }
});

app.get("/items/:id", (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const items = readItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).send("Item not found");
  }
  res.json(item);
});
// Place bid
app.post("/items/:id/bid", (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const { userId, amount } = req.body;
  const auction = readAuction();
  const items = readItems();
  const item = items.find((i) => i.id === itemId);
  const users = readUsers();
  const user = users.find((u) => u.id === userId);

  // la subasta está cerrada
  if (auction.isOpen !== true) {
    return res.status(403).send("Auction is closed");
  }
  // No hay userId o ItemId
  if (!userId || !item) {
    return res.status(400).send("userId and item are required");
  }
  // La cantidad es menor o igual a el highestBid
  if (amount <= item.highestBid) {
    return res.status(400).send("Bid amount must be higher than current bid");
  }
  // La cantidad supera el balance del usuario
  if (amount > user.balance) {
    return res.status(400).send("Insufficient balance");
  }

  // Si es el mismo,
  if (userId === item.highestBidder) {
    // liberar bid anterior
    user.balance += item.highestBid;
    user.reserved -= item.highestBid;

    // nuevo bid
    user.balance -= amount;
    user.reserved += amount;

    // actualizar info
    item.highestBid = amount;
    item.highestBidder = userId;
    item.highestBidderName = user.name;
  } else {
    
    // eliminar monto reservado de bidder anterior (reserva - highestbid)
    const lastBid = item.highestBid;
    const lastBidderId = item.highestBidder;
    if (lastBid > item.basePrice && lastBidderId !== null) {
      const idx = users.findIndex((u) => u.userId === lastBidderId);
      if (idx !== -1) {
        users[idx].balance += item.highestBid;
        users[idx].reserved -= item.highestBid;
      }
    }

    //actualizar monto reservado y balance
    user.balance -= amount;
    user.reserved += amount;

    // actualizar highestbid y bidder(id)
    item.highestBid = amount;
    item.highestBidder = userId;
    item.highestBidderName = user.name;
  }

  // actualizar
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2));

  res.json(item);
});

// Abrir auction (monitor)
app.post("/auction/openAll", (req, res) => {
  const auction = {
    isOpen: true,
    endTime: new Date(Date.now() + 60000), // 1 min
  };
  fs.writeFileSync(auctionFilePath, JSON.stringify({ auction }, null, 2));
  res.json(auction);
});
// Cerrar auction (monitor)
app.post("/auction/closeAll", (req, res) => {
  const auction = {
    isOpen: false,
    endTime: null,
  };
  const items = readItems();
  const users = readUsers();
  items.forEach((item) => {
    if (item.highestBidder && item.highestBid > item.basePrice) {
      item.sold = true;
      const winner = users.find((u) => u.id === item.highestBidder);
      if (winner) {
        winner.reserved -= item.highestBid;
        winner.balance = +winner.reserved;
      }
    }
  });
  // Marca cada item como sold = true , asignar ganador

  // Consolidar reservas -> a cada ganador, eliminar reservas y dejar valor final

  // Front Monitor: mostrar un resumen de los ganadores y precio final

  // Front Player : Mostrar un resumen de lo ganado y del balance final

  fs.writeFileSync(auctionFilePath, JSON.stringify({ auction }, null, 2));
  res.json(auction);
});

app.listen(5080, () => {
  console.log("Server is running on http://localhost:5080 ! ");
});
