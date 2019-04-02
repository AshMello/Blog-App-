const express = require('express')
const mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser')
const pgp = require('pg-promise')()
var session = require('express-session')
const app = express()
const path = require('path')
const connectionString = "postgres://localhost:5432/blogapp";
const db = pgp(connectionString)


app.use(session( {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.engine('mustache',mustacheExpress())
app.set('views','./views')
app.set('view engine','mustache')

const VIEWS_PATH = path.join(__dirname, '/views')

app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials', '.mustache'))


app.post('/register',(req,res) => {
  let username = req.body.username
  let password = req.body.password

  db.one('INSERT INTO userinfo (username,password) VALUES($1,$2) RETURNING userid;', [username,password])
  res.render('login', {message: 'Thank you for registering! Please login below.'})
})

app.post('/login',(req,res) => {
  let username = req.body.username
  let password = req.body.password

  db.one('SELECT * FROM  userinfo WHERE username = $1 AND password = $2', [username,password])
  .then((user) => {
    res.redirect('/index')
  }).catch(error => {
    res.render('login', {message: 'The User Name or Password is incorrect.  Please try again.'})
  })
})

app.post('/logout',(req,res) => {
  req.session.destroy(function(err) {
    if(err) {
      console.log(error)
    } else {
      res.redirect('/login')
    }
  })
})

app.get('/login',(req,res) => {
  res.render('login')
})

app.get('/index', (req,res) => {
    res.render('index')
})

app.get('/viewall', (req,res) => {
    db.any('SELECT postid,title,body FROM posts')
  .then((posts) => {
      res.render('viewall',{posts: posts})
  })
})

app.get('/chooseeditpost', (req,res) => {
  res.render('chooseeditpost')
})

app.get('/editpost', (req,res) => {
  db.any('SELECT postid,title,body FROM posts WHERE postid = $1', [postid])
  .then((posts) => {
      res.render('editpost',{posts: posts})
  })
})

app.post('/index',(req,res) => {

    let title = req.body.postTitle
    let body = req.body.postBody

    db.one('INSERT INTO posts(title,body) VALUES($1,$2) RETURNING postid;',[title,body])
    .then(() => {
      res.redirect('/viewall')
    }).catch(error => console.log(error))
})

app.post('/deletepost', (req,res) =>{
    let postid = parseInt(req.body.postId)
    db.none('DELETE FROM posts WHERE postid = $1',[postid])
  .then(() => {
    res.redirect('/viewall')
  })
})

app.post('/chooseeditpost', (req,res) =>  {
  let postid = parseInt(req.body.postId)
  db.any('SELECT postid,title,body FROM posts WHERE postid = $1', [postid])
  .then((posts) => {
    res.render('editpost',{posts: posts})
})
})

app.post('/editpost', (req,res) => {
  let title = req.body.postTitle
  let body = req.body.postBody
  let postid = req.body.postId
  db.none('UPDATE posts SET title = $1 , body = $2 WHERE postid = $3',[title,body, postid])
    .then(() => {
      res.redirect('/viewall')
})
})

app.listen(3000,() => {
    console.log("Server is running...")
  })
