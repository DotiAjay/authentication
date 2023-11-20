const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// AP!
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hasedPass = await bcrypt.hash(request.body.password, 10)
  const query1 = `select * from user where username='${username}';`
  const dbquery = await db.get(query1)
  if (dbquery === undefined) {
    const hasedPass = await bcrypt.hash(password, 10)
    const queryReg = ` INSERT INTO user(username,name,password,gender,location)
    
    values(
          '${username}',
          '${name}',
          '${hasedPass}',
          '${gender}',
          '${location}'
    );`

    let passLen = password.length
    if (passLen < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      const dbRes = await db.run(queryReg)
      response.status = 200
      response.send('User created successfully')
    }
  } else {
    response.status = 400
    response.send('User already exists')
  }
})
// API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userCheck = ` select * from user where username='${username}';`
  const query2 = await db.get(userCheck)
  if (query2 === undefined) {
    response.status = 400
    response.send('Invalid user')
  } else {
    let hased = query2.password
    const isPass = await bcrypt.compare(password, hased)

    if (isPass) {
      response.status = 200
      response.send('Login success!')
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  }
})
// API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const usercheck2 = ` select * from user where username='${username}';`
  const query3 = await db.get(usercheck2)
  if (query3 === undefined) {
    response.status = 400
    response.send('Invalid User')
  } else {
    const oldpass = query3.password

    const isPass = await bcrypt.compare(oldPassword, oldpass)

    if (isPass) {
      if (newPassword.length < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const newHased = await bcrypt.hash(newPassword, 10)
        const updatePass = `update user set password='${newHased}' where username='${username}'; `
        const updateRes = await db.run(updatePass)
        response.status = 200
        response.send('Password updated')
      }
    } else {
      response.status = 400
      response.send('Invalid current password')
    }
  }
})
module.exports = app
