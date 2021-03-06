'use strict';
const User = require(__dirname + '/model');

let userHandler = module.exports = {};
const cookieOptions = {
  maxAge: 900000,
  domain: process.env.NODE_ENV === 'production'? '.vam.fun' : null,
};

userHandler.getUserByName = (req, res, next) => {

  User.findOne({email: req.auth.email})
    .then(user => {
      if (!user) {
        return next({statusCode: 400, message: 'no user'});
      }
      req.user = user;
      next();
    })
    .catch(next);
};



userHandler.getUserById = (req, res, next) => {
  User.findOne({_id: req.decodedId})
    .then(user => {
      if (!user) {
        return next({statusCode: 400, message: 'no user'});
      }
      console.log(user);
      req.user = user;
      next();
    })
    .catch(next);
};

userHandler.signIn = (req, res, next) => {

  req.user.comparePassword(req.auth.password)
    .then(user => {
      if (user instanceof Error) {
        next({statusCode: 401, message: user.message});
      }
      let token = user.generateToken();
      console.log(token);
      res.cookie('auth', token, cookieOptions);
      res.send({user, token});
    })
    .catch(err =>
      next({statusCode: 403, message: err.message}));
};

userHandler.createUser = (req, res, next) => {
  const password = req.body.password;
  delete req.body.password;
  console.log('creating user', req.body);
  (new User(req.body)).generateHash(password)
    .then((user) => {
      user.save()
        .then(user => {
          let token = user.generateToken();
          console.log('saved and got token');

          res.cookie('auth', token, cookieOptions);
          res.send({user, token});
        })
        .catch(err => {
          next({statusCode: 400, message: `error saving user ${err.message}`});
        });
    })
    .catch(err => next({statusCode: 400, message: `error getting hash ${err.message}`}));
};

userHandler.validate = (req, res, next) => {

  User.findOne({_id: req.user._id})
    .then(user => {
      let token = user.generateToken();
      res.cookie('auth', token, cookieOptions);
      res.send({user,token});
    })
    .catch(next);
};

userHandler.delete = (req,res,next) => {
  try {
    let id = req.decodedId;
    console.log('req', req.decodedId);

    User.remove({_id: id})
      .then( () => res.send('user deleted'))
      .catch( (err) => next(err));
  }catch(err){
    next(err.message);
  }
};

userHandler.put = (req,res,next) => {
  try {
    let id = req.decodedId;
    console.log('id', req.decodedId);
    console.log('req body', req.body);

    User.findOne({_id: id})
      .then( result => {
        Object.assign(result, req.body);
        return result.save();
      })
      .then( user => {
        res.send(user);
      })
      .catch(err => next(err));
  }
  catch(error){
    next(error.message);
  }
};
