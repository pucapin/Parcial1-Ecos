const express = require("express")
const path = require("path")
const db = require("./db-util")
const fs = require("fs")

const app = express()

app.use(express.json())

app.use("/players-app", express.static(path.join(__dirname, "players_app"))) 
app.use("/monitor-app", express.static(path.join(__dirname, "monitor_app")))

const bidsFilePath = path.join(__dirname, "db", "bids.json");
const usersFilePath = path.join(__dirname, "db", "users.json");
const itemsFilePath = path.join(__dirname, "db", "items.json");

function readBids() {
  const data = fs.readFileSync(bidsFilePath, 'utf-8');
  return JSON.parse(data)
}
function readItems() {
  const data = fs.readFileSync(usersFilePath, 'utf-8');
  return JSON.parse(data)
}
function readUsers() {
  const data = fs.readFileSync(itemsFilePath, 'utf-8');
  return JSON.parse(data)
}


app.get("/users", (req, res) => {
  const users = db.load("users")
  res.status(200).send(users)
})

app.post('/users/register', (req, res) => {

})

app.get('/items?sort=highestBid', (req, res) => {

})

app.post('items/:id/bid', (req, res) => {

})

app.get('/users/:id', (req, res) = {

})

app.post('/auction/openAll', (req, res) => {

})

app.get('/items', (req, res) => {
  const sort = req.query.sort;
  let result  = readItems();

  if(sort === 'highestBid') {
    items.sort((a, b) => b.highestBid - a.highestBid)
  }
  res.json(result)
})

app.post('/auction/closeAll', (req, res) => {

})
app.listen(5080, () => {
  console.log("Server is running on http://localhost:5080")
})
