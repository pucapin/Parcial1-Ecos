const express = require("express")
const path = require("path")
const db = require("./db-util")
const fs = require("fs")

const app = express()

app.use(express.json())

app.use("/start", express.static(path.join(__dirname, "start"))) 
app.use("/player", express.static(path.join(__dirname, "player"))) 
app.use("/monitor", express.static(path.join(__dirname, "monitor")))

const auctionFilePath = path.join(__dirname, "db", "auction.json");
const usersFilePath = path.join(__dirname, "db", "users.json");
const itemsFilePath = path.join(__dirname, "db", "items.json");

function readAuction() {
  const data = fs.readFileSync(auctionFilePath, 'utf-8');
  return JSON.parse(data)
}
function readItems() {
  const data = fs.readFileSync(itemsFilePath, 'utf-8');
  return JSON.parse(data)
}
function readUsers() {
  const data = fs.readFileSync(usersFilePath, 'utf-8');
  return JSON.parse(data)
}

app.post('/users/register', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send("Name is required");
  }
  const users = readUsers();
  if (users.find(user => user.name === name)) {
    return res.status(409).send("User already exists");
  }
  const newUser = 
  { id: users.length + 1, 
    name,
    balance: 1000 };

  users.push(newUser);
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  res.status(201).send(newUser);
});

app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).send("User not found");
  }
  res.json(user);
})

app.get('/auction', (req, res) => {
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


app.get('/items', (req, res) => {
  try {
    const sort = req.query.sort;
    let items = readItems(); // could throw error

    if (sort === 'highestBid') {
      items.sort((a, b) => b.highestBid - a.highestBid);
    }

    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error when getting items" });
  }
});


app.post('items/:id/bid', (req, res) => {

})


app.post('/auction/openAll', (req, res) => {
  const auction = {
    isOpen: true,
    endTime: new Date(Date.now() + 60000) // 1 min
  };
  fs.writeFileSync(auctionFilePath, JSON.stringify({ auction }, null, 2));
  res.json(auction);
})

app.post('/auction/closeAll', (req, res) => {
  const auction = {
    isOpen: false,
    endTime: null
  };
  fs.writeFileSync(auctionFilePath, JSON.stringify({ auction }, null, 2));
  res.json(auction);
})

app.listen(5080, () => {
  console.log("Server is running on http://localhost:5080 ! ")
})
