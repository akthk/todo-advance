// server.js
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('./models/User');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Configure session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));


// server.js
mongoose.connect('mongodb+srv://akshit1293:Nuvsu22BVSR15MoB@cluster0.dwo3mcg.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});


// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Define routes and middleware
// ...
// server.js (continued)


// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Home page
app.get('/', (req, res) => {
  res.render('home');
});

// Login form submission
// Login form submission
app.post('/login', (req, res) => {
    const { userName, password } = req.body;
  
    // Find the user in the database
    User.findOne({ userName, password }, async (err, user) => {
      if (err || !user) {
        res.redirect('/login');
      } else {
        // Store the user ID in the session
        req.session.userId = user._id;
  
        // Update login history
        const loginEntry = {
          dateTime: new Date(),
          userAgent: req.get('User-Agent')
        };
        user.loginHistory.push(loginEntry);
        await user.save();
  
        res.redirect('/history');
      }
    });
  });
  

// Registration form
app.get('/register', (req, res) => {
  res.render('register');
});


// Registration form submission
// Registration form submission
app.post('/register', async (req, res) => {
    try {
      const { userName, password, email } = req.body;
  
      // Check if the username already exists
      const existingUser = await User.findOne({ userName });
      if (existingUser) {
        return res.redirect('/register'); // Redirect to registration page with an error message
      }
  
      // Create a new user object
      const user = new User({ userName, password, email });
  
      // Save the user to the database
      await user.save();
  
      res.redirect('/login');
    } catch (err) {
      console.error('Error registering user:', err);
      res.redirect('/register');
    }
  });
  

// History page
app.get('/history', requireLogin, (req, res) => {
  // Find the user in the database
  User.findById(req.session.userId, (err, user) => {
    if (err || !user) {
      res.redirect('/login');
    } else {
      res.render('history', { history: user.loginHistory });
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.redirect('/');
  });
});


// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
