// first we require the needed modules
const express = require( 'express' )
const sequelize = require( 'sequelize' )
const bodyparser = require( 'body-parser' )
const session = require( 'express-session' )

const app = express( )

// define the database in postgres that we can access trough sequelize
const db = new sequelize( 'blogapp', process.env.POSTGRES_USER, 
    process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres'
} )


app.set( 'view engine', 'pug' )
app.set( 'views', __dirname + '/views' )
app.use( bodyparser.urlencoded( { extended: true } ) )
app.use(express.static('public'));

// user a session for login functionality
app.use( session( {
    secret: 'omg, such a secret secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000
    }
} ) )


const user = db.define( 'user', {
    username: sequelize.STRING,
    email: sequelize.STRING,
    password: sequelize.STRING
} )

const post = db.define( 'post', {
    title: sequelize.STRING,
    message: sequelize.STRING
} )

const comment = db.define( 'comment', {
    message: sequelize.STRING
} )

post.belongsTo( user )
user.hasMany( post )
comment.belongsTo( post )
post.hasMany( comment )
comment.belongsTo( user )
user.hasMany( comment )

app.set( 'views', __dirname + '/views' )
app.set( 'view engine', 'pug' )

app.get( '/', ( req, res ) => {
    res.render( 'index' )
} )

app.get( '/new-user', ( req, res ) => {
    res.render( 'new-user', { user: req.session.user } )
} )

app.get( '/messageboard', ( req, res ) => {
    post.findAll().then( allposts => { 
        res.render( 'messageboard', { posts: allposts }, { user: req.session.user } )
    } ) 
} )

app.get( '/login', ( req, res ) => {
    res.render( 'login', { user: req.session.user } )
} )

app.get( '/logout', ( req, res ) => {
    res.render( 'logout', { user: req.session.user } )
} )

app.get( '/your-posts', ( req, res ) => {
    res.render( 'userposts', { user: req.session.user } )
} )

app.get( '/newpost', ( req, res ) => {
    res.render( 'newpost', { user: req.session.user } )
} )

app.get( '/index', ( req, res ) => {
    res.render( 'index', { user: req.session.user }  )
} )

app.post( '/new-user', ( req, res ) => {
    return user.create( {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    } ).then ( f => {
        res.render( 'login', { user: req.session.user } )
    } )
} )

app.post( '/newpost', ( req, res ) => {
    return post.create( {
        title: req.body.title,
        message: req.body.message
    } ).then ( f => {
        res.render( 'index', { user: req.session.user } )
    } )
} )

app.post( '/login', ( req, res ) => {
    console.log('Posted username is ', req.body.username)
    user.findOne( {
        where: {
            username: req.body.username
        }
    } ).then( theuser => {
        console.log('User from database is ',theuser )
        if ( theuser.password == req.body.password ) {
            req.session.user = theuser
            res.render( 'index', {
               user: theuser 
            } )
        } else {
            res.render( 'login' )
        }
    } )
} )

 app.post( '/logout', ( req, res ) => {
     req.session.destroy(  )
     res.render( 'index' )
 } )

app.listen( 3000, f => {
    console.log( 'Yo daaaawg! check out this sweeeet blog application on localhost: 3000' )
} )

db.sync( { force: false} )