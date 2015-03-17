var express = require('express');
var tweetBank = require('../tweetBank'); //removing tweetBank to wire up SQL model
var User = require('../models').User;
var Tweet = require('../models').Tweet;


module.exports = function (io) {

    var router = express.Router();

    router.get('/', function (req, res) {

        Tweet.findAll({include:[User]}).complete(function(err, tweetList){
            var tweets = tweetList.map(function(tweet){
                var obj = {};
                obj.id = tweet.dataValues.id;
                obj.text = tweet.dataValues.tweet;
                obj.name = tweet.dataValues.User.dataValues.name;
                return obj;
            });

            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets,
                showForm: true
            });
        
        });
    });

    router.get('/users/:name', function (req, res) {
        var name = req.params.name;

        User.find({where: {name : name}}).complete(function (err, user) {
            user.getTweets().complete(function (err, tweetsList){
                var tweets = tweetsList.map(function(tweet){
                    var obj = {};
                    obj.id = tweet.dataValues.id;
                    obj.text = tweet.dataValues.tweet;
                    obj.name = name;
                    return obj;
                });

                res.render('index', {
                    title: 'Twitter.js - Posts by ' + name,
                    tweets: tweets,
                    showForm: true
                });
            });
        });

        
    });

    router.get('/users/:name/tweets/:id', function (req, res) {
        var name = req.params.name;
        var id = parseInt(req.params.id);
        // var tweets = tweetBank.find({ id: id, name: name });

        User.find({where: {name: name, id : id}}).complete(function (err, user){

            user.getTweets().complete(function (err, tweetsList){
                var tweets = tweetsList.map(function(tweet){
                    var obj = {};
                    obj.id = tweet.dataValues.id;
                    obj.text = tweet.dataValues.tweet;
                    obj.name = name;
                    return obj;
                });

                res.render('index', {
                title: 'Twitter.js - Tweet by ' + name,
                tweets: tweets,
                showForm: true

            });
        });

        });

    });

    router.post('/submit', function(req, res) {
        var name = req.body.name;
        var text = req.body.text;

        // tweetBank.add(name, text);
        Tweet.max("id").then(function (max){
            var tweetId = max+1;
            User.findOrCreate({where: {name: name}}).complete(function(err, user){
                var userId = user[0].dataValues.id;

                var entry = {
                    id: tweetId,
                    UserId: userId,
                    tweet: text
                };
                Tweet.create(entry).then( function (newTweet){
                    console.log("Hey there: ", newTweet.dataValues);
                    var unformTweet = newTweet.dataValues;
                    var newObj = {
                        id: unformTweet.id,
                        name: name,
                        text: text
                    };
                    io.sockets.emit('new_tweet', newObj);
                    res.redirect('/');
                });
            });
            
        });
    });

    return router;

};