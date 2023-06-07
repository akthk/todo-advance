const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ejs = require('ejs');

// Create Express app
const app = express();
app.set('view engine', 'ejs');
// Connect to MongoDB Atlas
mongoose.connect('//connection string', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  // Define Mongoose schema
  const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [{
      dateTime: Date,
      userAgent: String,
    }],
  });

  // Define Mongoose model
  const User = mongoose.model('User', userSchema);

  // Configure session middleware
  app.use(
    session({
      secret: 'YOUR_SESSION_SECRET',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: '//connection string',
      }),
    })
  );

  // Parse request bodies as JSON
  app.use(express.json());

  // Login route
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ userName: username, password });

      if (!user) {
        return res.status(401).send('Invalid username or password');
      }

      // Update login history
      const userAgent = req.get('User-Agent');
      user.loginHistory.push({ dateTime: new Date(), userAgent });
      await user.save();

      req.session.user = user;
      res.redirect('/history');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

// Registration route
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if a user with the same username already exists (case-insensitive)
    const existingUser = await User.findOne({
      userName: { $regex: new RegExp(`^${username}$`, 'i') },
    });

    if (existingUser) {
      return res.status(409).send('Username already exists');
    }

    // Create a new user
    const user = new User({ userName: username, password, email });
    await user.save();

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


// History route
app.get('/history', (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.redirect('/');
  }

  res.render('history', { user, loginHistory: user.loginHistory });
});


  // Logout route
  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  // Home route
  app.get('/', (req, res) => {
    const user = req.session.user;
    res.render('home', { user });
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
});
