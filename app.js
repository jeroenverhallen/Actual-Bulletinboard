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
app.use( express.static( 'public' ) );

// user a session for login functionality
app.use( session( {
    secret: 'omg, such a secret secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60
    }
} ) )

// we define what the tables in the database look like
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

// We set relations between the different tables
post.belongsTo( user )
user.hasMany( post )
comment.belongsTo( post )
post.hasMany( comment )
comment.belongsTo( user )
user.hasMany( comment )

app.set( 'views', __dirname + '/views' )
app.set( 'view engine', 'pug' )


// default path
app.get( '/', ( req, res ) => {
    console.log('THe session is ', req.session)
    res.render( 'index', {
// If a user is logged in, he stays logged in when changing subpage
        user: req.session.user
    } )
} )

// the page for registering a new user
app.get( '/new-user', ( req, res ) => {
    res.render( 'new-user', {
        user: req.session.user
    } )
} )

// login
app.get( '/login', ( req, res ) => {
    res.render( 'login', {
        user: req.session.user
    } )
} )

// view all posts
    app.get( '/messageboard', ( req, res ) => {
        post.findAll().then( allposts => { 
            res.render( 'messageboard', { posts: allposts, user: req.session.user } )
        } ) 
    } )

// view all posts made by logged in user
    app.get( '/your-posts', ( req, res ) => {
        post.findAll( { where: { userId : req.session.user.id } } ).then( allposts => { 
            res.render( 'userposts', { posts: allposts, user: req.session.user } )
        } ) 
    } )

// create a new post
    app.get( '/newpost', ( req, res ) => {
        res.render( 'newpost', {
            user: req.session.user
        } )
    } )

// landing page
    app.get( '/index', ( req, res ) => {
        res.render( 'index', {
            user: req.session.user
        } )
    } )

// the session is destroyed when logging out, to prevent you from automatically being logged in again when going to a previously visited page
    app.get( '/logout', ( req, res ) => {
        console.log( 'now logging out' )
        req.session.destroy( )
        res.render( 'index' )
    } )

// this shows an individual post with comments and authors of both post and comments    
    app.get( '/singlepost/:title', ( req, res) => {
            post.findOne( {
            where: {
                title: req.params.title
            }, include: [
                { model: comment, include: [ user ] },
                { model: user }
            ]
        } )
        .then( singlepost => {
            console.log( 'the post with comments is ', singlepost.get({plain: true}) )
            res.render( 'comment', {
                post: singlepost,
                user: req.session.user
                } )
            } )
    } )

    app.post( '/new-user', ( req, res ) => {
        user.create( {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        } ).then ( f => {
            res.render( 'login', {
            user: req.session.user
        } )
        } )
    } )

    app.post( '/newpost', ( req, res ) => {
        post.create( {
            title: req.body.title,
            message: req.body.message,
            // the post is linked to the logged in user
            userId: req.session.user.id
        } ).then ( f => {
            res.render( 'index', {
            user: req.session.user
        } )
        } )
    } )

    app.post( '/login', ( req, res ) => {
        console.log('Posted username is ', req.body.username)
        // it looks for a user with the name you filled in in the form and then checks whether the password checks out
        user.findOne( {
            where: {
                username: req.body.username
            }
        } ).then( theuser => {
            console.log('User from database is ',theuser )
            if ( theuser.password == req.body.password ) {
                req.session.user = theuser
                console.log('Login session set to', req.session)
                res.render( 'index', {
                user: theuser 
                } )
            } else {
                res.render( 'login' )
            }
        } ).catch(console.log.bind(console))
    } )

    app.post( '/singlepost/:title', ( req, res ) => {
        console.log( 'your comment is ', req.body.comment )
        console.log( 'the user is ', req.session.user.username )
        console.log( 'the id of the post is ', req.body.postId )
        comment.create( {
            message: req.body.comment,
            userId: req.session.user.id,
            postId: req.body.postId
        } ).then ( ( user, post ) => {
            res.render( 'index', { user: req.session.user } )
        } )
    } )

app.listen( 3000, f => {
    console.log( 'Yo daaaawg! check out this sweeeet blog application on localhost: 3000' )
} )

db.sync( { force: false} )