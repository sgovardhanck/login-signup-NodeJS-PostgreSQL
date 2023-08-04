const express = require('express');
const app = express();
const bcrypt= require('bcrypt');
const {Pool}=require('pg');
const flash=require('express-flash');
const session = require('express-session');
const bodyParser = require('body-parser');

const PORT=3000;

//Set the view engine
app.set('views', __dirname + '/views');
app.set('view engine','ejs');

//MIDDLEWARES
app.use(express.static('public'));

app.use(express.urlencoded({extended:false}));
const pool = new Pool({
    user: 'suhas',
    host: 'localhost',
    database: 'loginsignupdb',
    password: 'suhas1',
    port: 5432 
  });

  app.use(session({
    secret: 'xyz@123',
    resave: false,
    saveUninitialized: true
  }));
  app.use(flash());

  app.use((req, res, next) => {
    res.locals.successMessage = req.flash('successMessage');
    next();
  });
  app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('errorMessage');
    next();
  });

//get:
app.get('/',(req,res)=>{
    res.render('login');
})
app.get('/signup',(req,res)=>{
    res.render('signup');
})
app.get('/login',(req,res)=>{
    res.render('login')
});
app.get('/dashboard',(req,res)=>{
    res.render('dashboard')
});

//Sign-up logic
app.post('/login', async(req,res)=>{
    let{username, email, password, password2}=req.body;
    console.log(req.body)
    if(password===password2)
    {
        const hashedPassword=await bcrypt.hash(password,10);
        pool.query('INSERT INTO users(username,email,password) VALUES ($1,$2,$3)',[username,email,hashedPassword],
        (err,result)=>
        {
            if (err){
                    // Check if the error is due to a duplicate key violation
                    if (err.constraint === 'users_email_key') 
                    {
                      res.status(409).send('This email address is already registered.');
                    } 
                    else 
                    {
                    console.error('Error executing query:', err);
                    res.status(500).send('An error occurred while inserting data.');
                    }
                    }
            else{
                console.log(result)
                console.log('user entered succesfully');
                req.flash('successMessage', 'Successful register!');
                res.redirect('/login');
                };
        });
    }
    else{
        
        // req.flash('errorMessage','Passwords dont match');
        // res.render('signup');
        const errorMessage='passwords dont match'
        res.render('signup', { errorMessage });
        
        };
});

//login logic:
app.post('/dashboard',async(req,res)=>{
    const{username,email,password}=req.body;
    console.log(password);
    // const usernameDashboard= await pool.query('SELECT * FROM users WHERE username =$1', [username]);
        // console.log(result);
    try {
        const result = await pool.query('SELECT * FROM users WHERE email =$1', [email]);
        console.log(result);
        if (result.rows.length === 0) {
          res.status(401).send('Invalid email id');
        //   return;
        }
            const user = result.rows[0];
            const usernameDashboard=user.username;
            
            console.log(user);
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            console.log(isPasswordMatch)
            console.log(password)
            console.log(user.password)

            if(isPasswordMatch)
                {
                    req.session.user = user; // Store user information in the session
                    
                    res.render('dashboard',{usernameDashboard});
                }
            else {
          res.status(401).send('Incorrect password');
        }
        }
    catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('An error occurred while processing your request');
      } 
});


app.listen(PORT,()=>{
    console.log("server is running on port", {PORT});

});